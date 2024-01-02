# grist-custom-widgets-fr-admin
"Widgets custom" pour Grist développés pour répondre aux besoins de l'administration française.

L'ensemble des "Widgets custom" sont présents dans un même projet développé en [Next.js](https://nextjs.org/) et utilise le mode `/app`.

Chaque dossier sous `/app` est un widget à part entière.

## Liste des widgets existants
Widgets de nettoyages de données :
- [codeInsee](app/codeInsee/README.md)
- [codeSiren](app/codeSiren/README.md) 
- [geocode](app/geocode/README.md)


## En Prod
Le projet est déployé via les Github Pages à partir de la branche `main` à l'adresse [https://betagouv.github.io/grist-custom-widgets-fr-admin/](https://betagouv.github.io/grist-custom-widgets-fr-admin/).

*NB: les widgets custom ne font que transiter de la donnée entre l'appel à des API et la lecture et l'écriture dans le tableau Grist. Aucune donnée présente sur Grist n'est stocké dans les serveurs de github*


## En local

Install, run the development server:

```bash
npm install
npm run dev
# or
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Pour contribuer

Toute personne travaillant pour l'administration française peut contribuer à ce projet en créant de nouveaux widgets ou en proposant des corrections / améliorations à ceux existant. 

### Etapes d'un nouveau widget
Créer un nouveau dossier sous `/app`.

TODO

### Règles de commit
Si le commit concerne un widget en particulier le préciser 

[Nom du widget] : [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)

Exemple : 
```bash
[codeInsee]: feat: add filter
```
