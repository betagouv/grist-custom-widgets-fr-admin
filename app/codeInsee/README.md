# Code Insee

Ce widget permet de nettoyer de la donnée existante en ajoutant dans une nouvelle colonne le code Insee correspondant à la colonne collectivité.

API utilisée : https://geo.api.gouv.fr/decoupage-administratif

## Configuration requise

La colonne **Nature juridique (maille)** est **obligatoire**. Elle permet de déterminer l'endpoint de l'API à utiliser :
- **Commune (COM)** : `https://geo.api.gouv.fr/communes`
- **EPCI** (CA, CC, CU, EPT, METRO, etc.) : `https://geo.api.gouv.fr/epcis`
- **Département (DEP)** : `https://geo.api.gouv.fr/departements`
- **Région (REG)** : `https://geo.api.gouv.fr/regions`

## Fonctionnement

Pour chaque ligne, le widget interroge l'API afin de trouver le code INSEE correspondant.
Il est possible que l'API ne trouve aucun résultat ou en trouve plusieurs et ne sait pas laquelle choisir. Dans le dernier cas, le widget demande à l'utilisateur de choisir via le `ChoiceBanner`.

L'utilisateur peut effectuer une recherche globale (l'API sera appelée pour chaque ligne, l'une après l'autre si aucun résultat n'existe déjà) ou une recherche spécifique pour la ligne sélectionnée.

Une fois le travail de renseignement et nettoyage terminé, ce widget est voué à être supprimé.
