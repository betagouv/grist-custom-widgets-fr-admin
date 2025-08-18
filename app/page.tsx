const HomePage = () => (
  <div>
    <h1>Les widgets custom Grist de Beta</h1>
    <p>
      Liste des widgets utilisables :
      <ul>
        <li>
          <b>/codeInsee</b> : permet de déterminer les codes insee des communes,
          départements et régions
        </li>
        <li>
          <b>/geocode</b> : permet de géocoder (trouver la latitude et la
          longitude) à partir d'une adresse
        </li>
        <li>
          <b>/codeSiren</b> : permet de déterminer le code siren d'une
          entreprise ou d'une collectivité territoriale
        </li>
        <li>
          <b>/omFiller</b> : permet de remplir des formulaires PDF
          automatiquement
        </li>
        <li>
          <b>/insituIndicateurs</b> : permet de remplir les indicateurs pour des
          codes Insee donnés
        </li>
        <li>
          <b>/qpv</b> : permet de déterminer si une adresse géocodée (avec
          latitude et longitude) se situe dans un Quartier Prioritaire de la
          Ville (QPV) et, le cas échéant, de fournir le nom et le code du QPV
        </li>
      </ul>
    </p>
  </div>
);

export default HomePage;
