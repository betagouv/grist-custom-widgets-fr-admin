# Code SIREN

Ce widget permet de nettoyer de la donnée existante en ajoutant dans une nouvelle colonne le code Siren correspondant à la colonne nom de l'entreprise ou de la collectivité.

API utilisée : https://recherche-entreprises.api.gouv.fr

Pour chaque ligne le widget interroge l'API afin de trouver le code SIREN correspondant.
Il est possible que l'API ne trouve aucun résultat ou en trouve plusieurs. 
Pour le moment l'API ne retourne pas de score de fiabilité et retourne presque toujours plusieurs résultats. Le premier résultat retourné est celui pris en compte.

Le `ChoiceBanner` permettant à l'utilisateur de choisir parmis les choix proposés par l'API en cas d'ambiguité n'est donc dans les faits jamais utilisés pour le moment. Si nous proposons à l'utilisateur de désambiguer à chaque fois ça pourrait être très laborieux puisqu'il faudrait le faire pour toutes les lignes. \
&rarr; C'est un point à améliorer, potentiellement en contribuant à l'API. 

L'utilisateur peut effectuer une recherche globale (l'API sera appelée pour chaque ligne, l'une après l'autre si aucun résultat n'existe déjà) ou une recherche spécifique pour la ligne sélectionnée.

Une fois le travail de renseigement et nettoyage terminé ce widget est voué à être supprimé.
