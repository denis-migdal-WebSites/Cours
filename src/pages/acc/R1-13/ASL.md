
<div class="danger">Par défaut, les fichiers cachés (i.e. dont le nom commence par <script type="c-text">.</script>) ne s'affichent pas lors d'un <script type="c-bash">ls</script>. Pour les afficher, il faudra ajouter l'option <script type="c-bash">-A</script> (<i><u>a</u>ll</i>) : <script type="c-bash">ls -A</script>.</div>


<div>Bien évidemment, le Shell fournit des commandes pour manipuler l'historique et ré-exécuter des commandes :
    <ul>
        <li><script type="c-bash">history</script> : affiche les dernières lignes de commandes exécutées.</li>
        <li><script type="c-bash">!!</script> : réexécuter la dernière commande exécutée.</li>
        <li><script type="c-bash">!<h>$CMD</h></script> : réexécute la dernière commande <script type="c-bash"><h>$CMD</h></script> exécutée.</li>
    </ul>
</div>