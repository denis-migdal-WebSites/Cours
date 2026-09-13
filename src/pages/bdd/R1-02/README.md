<li>corrigés+DS disponibles sur Moodle 2024-2025</li>

<h2>Supports</h2>

-> regénérer les supports (attention aux marges pour versions impr.)

<li>tous :</li>
  -> '' : string
  -> `` : nom de colonne
  -> éviter "".

=> les commentaires en SQL ? (--)

<li>CM</li>
  -> 1h/séance suffisant.
  -> améliorer les exemples, rédiger les détails non-rédigés.
  -> améliorer/ajouter les exemples interactifs/animations
    -> CM2
      -> mieux expliquer les agrégations ?
    -> CM3
      -> exemple de pourquoi index + rapide.
    -> CM4
      -> ss-rqt corrélée : une animation pour montrer la différence.
      -> join : exemples + explicites (e.g. produit/vente/etc)
      -> exemple de JOIN chaîné
      -> inverser l'ordre des tables de l'exemple (#57) et montrer LEFT JOIN.
  -> rajouter certains conseils de TD en CM.
    -> CM1
      -> attention uniquement cols demandées, respecter la casse, indenter la rq.
    -> CM4
      -> comment bien faire un join ?
        -> suivre les flèches
        -> commencer par les plus petites tables/résultats.

<li>TP</li>
  -> TP1
    -> ajouter des questions pour COALESCE pour mieux comprendre.
    -> reformuler COALESCE : a si non null sinon b.
    -> c/c pour éviter erreur recopie quand met la réponse sur le sujet.
  -> TP2
    -> on peut utiliser ORDER BY & LIMIT pour DELETE.

<h2>Organisation DS</h2>

<li>imprimer le cheat sheet (attention aux marges).</li>
<li>mettre en place un serveur web en mode DS (pour le sujet).</li>

<h3>TP5</h3>

<li>test postgres GUI (plateforme UCA BDD)</li>

<h2>Idées TD</h2>

<h3>TD3</h3>

Comment bien choisir les clef primaires/étrangères
Comment bien découper en tables (conception), dépendance fonctionnelle (?).

<h3>TP5</h3>

<li>interfaces pgAdmin / python bindings (injections) ?</li>
<li>PRAGMA optimize;  / OPTIMIZE => avant chaque fermeture de la database. (?)</li>

<h2>Export/import</h2>

Fréquent CSV (e.g. tableur)

import/export/save table (schema/data)
  -> as SQL
  -> as CSV
  ?
+ .mode (exports) / .dump  // .import

=> mesure perfs db in memory.

## Idée animation sous-requête

Contenu:
  - subqueries animations...
    - T1 table
    - subquery (updated if correlated)
    - subquery table
    -> exec op for cmp
    - result table.

<li>ss-rq visu (?)</li>
  - normale : calculée une seule fois.

  - animation : < [P/=] >
    - X in (....)
    - 4 in (....) - 1) curseur sur liste 2) when found, next value and add line.

    - X in (QUERY)
    - 4 in [...] <- (QUERY [replace values ?])
      - 1) liste construite avec le curseur
      - 2) when found, next value.

  - normale
    - X in (liste/value) => once (....). 
      -> build result table below, one line by one.
  - corrélée, recalculée à chaque fois.
    - X in | (value change (car calculé))
      -> build result table below, one line by one.
