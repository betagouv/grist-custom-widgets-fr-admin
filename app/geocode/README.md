# Geocode

Ce widget permet de nettoyer de la donnée existante en ajoutant dans deux nouvelles colonnes la latitude et la longitude correspondant à la colonne adresse.

API utilisée : https://api-adresse.data.gouv.fr

Pour chaque ligne le widget interroge l'API afin de trouver le geocodage correspondant.
Il est possible que l'API ne trouve aucun résultat ou en trouve plusieurs et ne sait pas laquelle choisir. Dans le dernier cas, le widget demande à l'utilisateur de choisir via le `ChoiceBanner`.

L'utilisateur peut effectuer une recherche globale (l'API sera appelée pour chaque ligne, l'une après l'autre si aucun résultat n'existe déjà) ou une recherche spécifique pour la ligne sélectionnée.

Une fois le travail de renseigement et nettoyage terminé ce widget est voué à être supprimé.
