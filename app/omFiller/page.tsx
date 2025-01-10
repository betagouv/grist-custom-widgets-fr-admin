"use client";

const OmFillerHome = () => (
  <div style={{ padding: "20px" }}>
    <h1>
      OM Filler - Widgets de remplissage de formulaires PDF d'ordre de mission
    </h1>
    <p>
      Cette collection de widgets permet de gérer le workflow complet des ordres
      de mission et états de frais :
    </p>
    <ul>
      <li>
        <b>/omFiller/agent</b> : Widget permettant à un agent de remplir son
        ordre de mission. Les données de Grist sont utilisées pour remplir
        automatiquement le formulaire PDF, incluant la signature de l'agent.
      </li>
      <li>
        <b>/omFiller/manager</b> : Widget permettant au manager de signer
        l'ordre de mission précédemment rempli par l'agent. Le manager peut
        ajouter sa signature numérique au document. Les états de frais sont
        gérés de manière similaire.
      </li>
      <li>
        <b>/omFiller/agent-expense</b> : Widget permettant à l'agent de remplir
        l'état de frais associé à sa mission, en utilisant les données de Grist
        et en ajoutant sa signature.
      </li>
    </ul>
    <h2>Comment utiliser</h2>
    <p>Pour utiliser ces widgets :</p>
    <ol>
      <li>Configurez les colonnes dans Grist selon les mappings requis</li>
      <li>
        Ajoutez le widget approprié comme vue personnalisée dans votre document
        Grist
      </li>
      <li>Sélectionnez une ligne contenant les données à utiliser</li>
      <li>Vérifiez l'aperçu du PDF généré</li>
      <li>Sauvegardez le PDF dans Grist</li>
    </ol>
    <p>
      <i>
        Note : Ces widgets utilisent pdf-lib pour la manipulation des PDFs et
        nécessitent des modèles de PDF spécifiques avec des champs de formulaire
        prédéfinis.
      </i>
    </p>
  </div>
);

export default OmFillerHome;
