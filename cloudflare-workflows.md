## Cloudflare Workflows

Ono se řekne: "Za týden vytvoř v účetním systému fakturu, PDF rozparsuj do HTML a pošli zákazníkovi e-mailem."

Ale těch věcí, co se může pokazit!
* Náš účetní systém je občas přetížený a odpovídá `503 Service Unavailable`, takže volání musíme zopakovat.
* Když už fakturu přijme, tak nám nevrátí `201 Created`, ale `202 Accepted` s hlavičkou `Location` odkazující na fakturu. Ta faktura tam samozřejmě není vystavená hned, protože to systému chvíli trvá.
* Když už je faktura vystavená, tak PDF musíme stáhnout z S3, což se ale také nemusí povést na první dobrou.
* O těch problémech při parsování PDF ani nemluvě.
* A poslání samotného e-mailu je už jen třešnička na dortu.

Každý z těchto kroků se může pokazit, ale předchozí kroky nechceme opakovat. Vždyť každé to stažení z S3 něco stojí a volání AI na parsování faktur taky není zadarmo.

Nechci si ani představovat, co za šelmostroj to musí být. Naštěstí můžu použít Cloudflare Workflows (zatím veřejná Beta).

### Co jsou Cloudflare Workflows

> Workflows is a durable execution engine built on Cloudflare Workers. Workflows allow you to build multi-step applications that can automatically retry, persist state and run for minutes, hours, days, or weeks. Workflows introduces a programming model that makes it easier to build reliable, long-running tasks, observe as they progress, and programatically trigger instances based on events across your services.
>
>[dokumentace](https://developers.cloudflare.com/workflows/)

* Každý `WorkflowEntrypoint` má metodu `run`.
* Každá metoda `run` obsahuje jeden nebo více kroků `step`.
* Každý krok `step` může něco dělat `step.do` (a vracet hodnotu), čekat `step.sleep` nebo čekat-dokud `steps.sleepUntil`.
* Každý krok `step.do` může obsahovat konfiguraci, která určuje jeho chování při opakování.
* Workflow umožňuje vrátit každý krok do (volitelného) stavu, když nějaké následující kroky selžou, aniž by se musely opakovat všechny předchozí kroky.

### Náš (naivní) příklad s fakturou

```typescript
// naše faktura co chceme vystavit
type InvoiceParams = {
  data: any;
};

export class InvoiceWorkflow extends WorkflowEntrypoint<Env, InvoiceParams> {
  async run(event: WorkflowEvent<InvoiceParams>, step: WorkflowStep) {
    // Počkáme týden
    await step.sleep("wait for a week", "1 week");

    // Vytvoříme fakturu v účetním systému
    const invoice_url = await step.do(
      "create invoice",
      {
        retries: {
          limit: 10,
          delay: "10 seconds",
          backoff: "linear",
        },
        timeout: "30 minutes",
      },
      async () => {
        let response = await fetch("https://our.payment.system/invoices", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify(event.payload.data),
        });

        if (response.status === 503) {
          // vyhozený Error nám zopakuje krok
          throw new Error("invoicing has failed, try again");
        }

        if (response.status === 418) {
          // vyhozený NonRetryableError nám ukončí celé Workflow
          throw new NonRetryableError("invoicing has unknown status, don't try again");
        }

        return response.headers.get("Location");
      },
    );

    // Stáhneme fakturu
    const invoice = await step.do("fetch invoice", {/* options */ }, async () => {
      console.log(`fetch invoice from URL ${invoice_url}`);
      //...
    });

    // Stáhneme PDF z S3
    const pdf = await step.do("download PDF", ...);

    // Parsujeme PDF pomocí AI
    const parsed_invoice = await step.do("parse PDF", ...);

    // A nakonec odesíláme fakturu zákazníkovi
    await step.do("send e-mail with invoice", ...);
  }
}
```
