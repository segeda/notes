## Git submoduly

*Disclaimer: Tento článek mohl být tweet, ale napsal jsem ho hlavně pro své budoucí já.*

Git submoduly umožňují vložit do repozitáře jiný repozitář. To je užitečné, pokud chcete využít kód z jiného repozitáře, aniž byste ho museli kopírovat do svého repozitáře.

Já jsem potřeboval do různých projektů použít jeden zdroj dat. Původní řešení obnášelo kopírování souborů do každého projektu. To bylo nepraktické, protože jsem musel aktualizovat soubory v každém projektu, když se změnily.

Git submoduly mi umožnily vložit zdroj dat do každého projektu. Když se zdroj dat změní, stačí aktualizovat submodul a změny se projeví ve všech projektech.

Lze použít i pro data, která se dynamicky mění. Třeba pomocí GitHub Action [flat-data](https://githubnext.com/projects/flat-data/). Potom se už jen musí updatnout projekt se submodulem.

### Postup

Pokud změním data v submodulu:

1. Provést změny v submodulu
2. Commitnout a pushnout změny v submodulu
3. Aktualizovat submodul a commitnout změnu v projektu

#### Repozitář pro zdroj dat

[Vytvořil](https://github.com/segeda/data-json/commit/91da2f325d1874a608736fd7bf1c8852aec388b3) jsem repozitář [segeda/data-json](https://github.com/segeda/data-json) na [GitHubu](https://github.com/). Do repozitáře jsem [nahrál soubor](https://github.com/segeda/data-json/commit/9c85f52890eb2dc302800e0a3565047a22d72847) s daty.

#### Repozitář pro projekt

[Vytvořil](https://github.com/segeda/data-js/commit/9d9531f420caf7ac51d92b16611f6fb15ca14a6e) jsem repozitář [segeda/data-js](https://github.com/segeda/data-js) projektu.

Přidal jsem submodul s daty do repozitáře projektu.

```bash
git submodule add git@github.com:segeda/data-json.git data
git commit -m "add submodule"
```

#### Aktualizace submodulu

Když se [změní data](https://github.com/segeda/data-json/commit/a10ed80aac224b7dfebfa586df77c6382a28e78b), stačí [aktualizovat submodul](https://github.com/segeda/data-js/commit/1ddce25d666c00c9be443f553aa681afbcf759f0).

```bash
git submodule update --remote data
git commit -am "update submodule"
```

#### Klonování projektu

Pokud chcete klonoval projekt se submoduly, musíte inicializovat submoduly.

```bash
git clone git@github.com:segeda/data-js.git
cd data-js
git submodule init
git submodule update
```
