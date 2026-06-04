# LetterBook — Guide utilisateur

## 1. Créer un compte et se connecter

1. Ouvrez la page d’accueil et cliquez sur **Rejoindre** (ou **Créer un compte**).
2. Renseignez pseudo, email et mot de passe (8 caractères minimum).
3. Cochez la case de consentement au traitement des données (RGPD), puis validez.
4. Pour vous connecter ensuite, utilisez **Connexion** avec votre email et mot de passe.

## 2. Construire sa bibliothèque

1. Allez dans **Ma bibliothèque** (compte requis).
2. Cliquez sur **Ajouter un livre**, recherchez par titre ou auteur.
3. Les résultats proviennent de Google Books si une clé API est configurée sur le serveur ; sinon, ajoutez des ouvrages déjà présents dans la base via la recherche locale.
4. Ajoutez un livre avec le statut **À lire** ou **En cours**. Vous pouvez suivre une progression en pourcentage pour les livres **En cours**.

## 3. Publier un avis

1. Ouvrez la **fiche d’un livre** (depuis le fil, votre bibliothèque ou un profil).
2. Si vous n’avez pas encore noté ce livre, un formulaire **Publier un avis** apparaît (compte requis).
3. Choisissez une note entre 1 et 5 et rédigez votre texte, puis validez.

## 4. Réseau et fil d’actualité

### S’abonner et devenir amis

- Sur un **profil** ou dans **Découvrir** (menu **Lecteurs**), utilisez **S’abonner** pour suivre un lecteur.
- Lorsque vous vous suivez **mutuellement**, vous devenez **amis** (abonnement réciproque). Un badge **Ami** peut apparaître sur le fil.
- **Mon réseau** (`/network`) liste vos abonnements, abonnés et amis. Les compteurs sur votre profil ouvrent directement l’onglet correspondant.

### Les onglets du fil

| Onglet | Contenu |
|--------|---------|
| **Pour vous** | Activité des personnes que vous suivez |
| **Amis** | Activité de vos amis (abonnement mutuel) |
| **Communauté** | Toute l’activité publique (accessible sans compte) |

Les notifications signalent les nouveaux abonnés et les nouveaux liens d’amitié mutuelle (cloche en haut à droite).

## 5. Échanger sur les livres

- **J’aime** : sur une fiche livre, utilisez le bouton sous un avis pour liker (une deuxième pression retire le like).
- **Commentaires** : sous chaque avis, saisissez un court commentaire puis **Envoyer**.

## 6. Profil public

Chaque membre dispose d’une page **Profil** (menu ou lien `/profiles/<id>`) affichant bio, statistiques (livres, avis, abonnés, abonnements, amis), historique récent et derniers avis.

## 7. Recherche de livres

Depuis la barre de recherche ou la page **À découvrir**, cherchez par titre, auteur ou ISBN. Les résultats combinent la base LetterBook et, si le serveur est configuré, une recherche étendue de métadonnées.

## 8. Administration (comptes autorisés)

Les administrateurs accèdent à **Admin** pour consulter les utilisateurs et suspendre ou réactiver un compte en cas de modération.

## 9. Paramètres du compte

Depuis **Paramètres** (icône engrenage dans la barre de navigation, lien sur votre profil ou `/settings`) vous pouvez :

- modifier votre pseudo, bio et URL de photo ;
- changer votre mot de passe ;
- **supprimer définitivement** votre compte (confirmation par saisie du pseudo).

## 10. Gérer sa bibliothèque

Sur chaque livre de **Ma bibliothèque**, vous pouvez changer le **statut** de lecture, ajuster la **progression** (pour les livres « En cours ») et **retirer** un ouvrage de la liste.

## 11. Supprimer son compte (API)

La suppression est aussi disponible via l’API (`DELETE /api/me`) pour les intégrations ; l’interface web utilise la même route depuis la page Paramètres.

Pour l’installation en production, voir [`docs/DEPLOIEMENT.md`](DEPLOIEMENT.md). Pour le développement local, reportez-vous au `README.md` à la racine du projet.
