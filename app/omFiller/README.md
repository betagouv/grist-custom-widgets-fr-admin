# OM Filler

Ce widget permet de remplir automatiquement des formulaires PDF avec les données présentes dans Grist. Il est composé de trois sous-widgets :

- `/omFiller/agent` : Permet à un agent de remplir un ordre de mission
- `/omFiller/manager` : Permet à un manager de signer l'ordre de mission et l'état de frais associé
- `/omFiller/agent-expense` : Permet à l'agent de remplir l'état de frais associé

Ce widget utilise la bibliothèque pdf-lib pour la manipulation des PDFs.

## Fonctionnement

Le widget permet de :

- Remplir automatiquement les champs de formulaire PDF à partir des données Grist
- Ajouter des signatures numériques aux emplacements spécifiés
- Gérer les cases à cocher et les champs de date/heure
- Prévisualiser le PDF avant enregistrement
- Sauvegarder le PDF rempli comme pièce jointe dans Grist

## Configuration

Chaque sous-widget nécessite une configuration spécifique des colonnes dans Grist pour faire correspondre les données aux champs du formulaire PDF. Les mappings sont définis dans les fichiers constants.ts de chaque sous-widget.

Les champs supportés incluent :

- Champs texte
- Cases à cocher
- Dates et heures
- Signatures (images PNG)
- Emplacements de signature personnalisés

Si votre formulaire PDF nécessite des champs supplémentaires ou différents, vous pouvez les ajouter en modifiant les fichiers constants.ts de chaque sous-widget. Une adaptation supplémentaire pourra être nécessaire dans le code pour supporter les nouveaux champs.

## Utilisation

1. Sélectionner une ligne dans Grist contenant les données à utiliser
2. Le widget charge automatiquement le modèle PDF et remplit les champs
3. Vérifier l'aperçu du PDF généré
4. Cliquer sur "Save to Grist" pour enregistrer le PDF comme pièce jointe

Une fois le PDF généré et sauvegardé, il peut être traité par le widget suivant dans le workflow (signature manager ou état de frais).
