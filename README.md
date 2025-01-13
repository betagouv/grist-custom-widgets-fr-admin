# grist-custom-widgets-fr-admin
"Widgets custom" pour Grist développés pour répondre aux besoins de l'administration française.

L'ensemble des "Widgets custom" sont présents dans un même projet développé en [Next.js](https://nextjs.org/) et utilise le mode `/app`.

Chaque dossier sous `/app` est un widget à part entière.

## Liste des widgets existants
Widgets de nettoyages de données :
- [codeInsee](app/codeInsee/README.md)
- [codeSiren](app/codeSiren/README.md) 
- [geocode](app/geocode/README.md)
- [omFiller](app/omFiller/README.md)


## En Prod
Le projet est déployé via les Github Pages à partir de la branche `main` à l'adresse [https://betagouv.github.io/grist-custom-widgets-fr-admin/](https://betagouv.github.io/grist-custom-widgets-fr-admin/).

*NB: les widgets customs ne font que transiter de la donnée entre l'appel à des API et la lecture et l'écriture dans le tableau Grist. Aucune donnée présente sur Grist n'est stocké dans les serveurs de github*

Pour ajouter un widget à la liste de l'instance de l'ANCT il faut l'ajouter au fichier `public/widget-list.json`


## En local

Installer et lancer le serveur de developpement:

```bash
npm install
npm run dev
# or
yarn install
yarn dev
```

Puis (idéalement) depuis une instance local de Grist ajoutez une vue "custom" à une page correspdant au contexte de votre widget et indiquez l'url correspondant à votre widget. 
Par exemple pour le geocodeur : [http://localhost:3000/geocode](http://localhost:3000/geocode)

Vous pouvez également ouvrir cet url directement dans une nouvelle page de votre navigateur, une vue étant en réalité un iFrame.

## Pour contribuer

Toute personne travaillant pour l'administration française peut contribuer à ce projet en créant de nouveaux widgets ou en proposant des corrections / améliorations à ceux existants. 

Pour créer un nouveau widget il suffit de créer un dossier sous `/app` et d'y développer le widget en question.

[Documentation Grist pour la création de widget](https://support.getgrist.com/widget-custom/)


**Règles de commit**

Si le commit concerne un widget en particulier le préciser 

[Nom du widget] : [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)

Exemple : 
```bash
[codeInsee]: feat: add filter
```
