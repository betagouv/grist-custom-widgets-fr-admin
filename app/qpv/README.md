# QPV

Ce widget permet de vérifier si plusieurs adresses géocodées (avec latitude et longitude) se situent dans un Quartier Prioritaire de la Ville (QPV) et, le cas échéant, de fournir le nom et code de QPV.

Il exploite les données issues du fichier "Périmètre des QPV au format geojson (ESPG:4326)", mis à jour le 27 juin 2024 et hébergées sur data.gouv.
Source des données : https://www.data.gouv.fr/datasets/quartiers-prioritaires-de-la-politique-de-la-ville-qpv/community-resources

Pour utiliser ce widget, il est nécessaire que les adresses aient au préalable des coordonnées latitude et longitude. Si ces données sont manquantes, l'utilisateur peut avoir recours au widget Géocodeur pour les ajouter automatiquement. 
Une fois l'analyse lancée, le widget va déterminer pour chaque adresse géocodée si elle se trouve dans un QPV et renseigner par vrai ou faux une colonne dédiée. Si c'est le cas, il remplira automatiquement les colonnes pour le nom et le code du QPV. Si une adresse est hors d'un QPV, ces champs resteront vides. 
