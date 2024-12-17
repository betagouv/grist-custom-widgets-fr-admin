# Code Insee

Ce widget permet de nettoyer de la donnée existante en ajoutant dans une nouvelle colonne le code Insee correspondant à la colonne collectivité.

API utilisée : https://addok.donnees.incubateur.anct.gouv.fr

Pour chaque ligne le widget interroge l'API afin de trouver le code INSEE correspondant.
Il est possible que l'API ne trouve aucun résultat ou en trouve plusieurs et ne sait pas laquelle choisir. Dans le dernier cas, le widget demande à l'utilisateur de choisir via le `ChoiceBanner`.

L'utilisateur peut effectuer une recherche globale (l'API sera appelée pour chaque ligne, l'une après l'autre si aucun résultat n'existe déjà) ou une recherche spécifique pour la ligne sélectionnée.

Une fois le travail de renseigement et nettoyage terminé ce widget est voué à être supprimé.
