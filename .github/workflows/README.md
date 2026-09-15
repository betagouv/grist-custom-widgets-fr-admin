# GitHub Actions Workflows

## Update QPV Data (`update-qpv-data.yml`)

Ce workflow automatise la mise à jour hebdomadaire du fichier GeoJSON des Quartiers Prioritaires de la Politique de la Ville (QPV).

### Déclenchement

- **Automatique** : Chaque lundi à 2h00 UTC (3h00 heure de Paris en hiver, 4h00 en été)
- **Manuel** : Peut être déclenché manuellement depuis l'onglet "Actions" de GitHub

### Fonctionnement

1. **Téléchargement** : Récupère le fichier GeoJSON depuis data.gouv.fr
2. **Validation** : Vérifie que le fichier téléchargé n'est pas vide
3. **Détection de changements** : Compare avec la version actuelle
4. **Commit automatique** : Si le fichier a changé, crée un commit et le pousse sur le dépôt
5. **Notification d'erreur** : En cas d'échec, crée une issue GitHub automatiquement

### Source des données

- **URL** : https://www.data.gouv.fr/fr/datasets/r/942d4ee8-8142-4556-8ea1-335537ce1119
- **Fichier local** : `public/qp-politiques-ville.geojson`
- **Taille approximative** : ~11 MB

### Déclenchement manuel

Pour mettre à jour les données manuellement :

1. Allez dans l'onglet "Actions" du dépôt GitHub
2. Sélectionnez le workflow "Update QPV Data"
3. Cliquez sur "Run workflow"
4. Sélectionnez la branche (généralement `main`)
5. Cliquez sur "Run workflow"

### Permissions requises

Ce workflow nécessite :
- **Lecture** du dépôt (checkout)
- **Écriture** pour pusher les changements (via `GITHUB_TOKEN`)
- **Création d'issues** en cas d'échec

### Maintenance

Si le workflow échoue régulièrement :
1. Vérifiez que l'URL source est toujours valide
2. Consultez les logs dans l'onglet Actions
3. Une issue sera automatiquement créée pour signaler le problème
