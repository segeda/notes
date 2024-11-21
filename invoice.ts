// naše faktura co chceme vystavit
type InvoiceParams = {
  data: any;
};

export class cartInvoicesWorkflow extends WorkflowEntrypoint<Env, InvoiceParams> {
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

    // Počkáme 10 vteřin, protože náě účetní systém je opravdu pomalý
    await step.sleep("wait 10 seconds before catching invoice", "10 seconds");

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
