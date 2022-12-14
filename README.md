# TwitterPlus
Twitter+ project

## Installation
```
npm i
npm run dev
```

## Services

### Accounts
| Endpoint               | Method | Description                                                                                         | AUTH   |
| ---------------------- | ------ | --------------------------------------------------------------------------------------------------- | ------ |
| /accounts              | POST   | créer un compte (nom, email et mdp requis)                                                          | NON    |
| /accounts              | PATCH  | permet de changer une ou plusieurs info du compte (name, email, picture, background, certification) | REQUIS |
| /accounts/password     | PATCH  | demande l'ancien mot de passe et le nouveau, puis modifies le si l'ancien est valide                | REQUIS |
| /nameAvailability      | GET    | name en query, permet de vérifier si le nom d'utilisateur est disponible                            | NON    |
| /accounts/:name?       | GET    | récupères les infos du compte demandé via le nom, ou de son propre compte                           | REQUIS |
| /findAccounts          | GET    | name en query, permet de donner une liste de max 3 comptes avec un nom similaire                    | REQUIS |
| /accountRecommandation | GET    | envoie une liste de 5 comptes aléatoires                                                            | REQUIS |
| /leaderboard           | GET    | récupère les infos des 3 comptes avec le plus d'abonnées                                            | REQUIS |

### Authentication
| Endpoint      | Method | Description                                                                     | AUTH   |
| ------------- | ------ | ------------------------------------------------------------------------------- | ------ |
| /authenticate | POST   | a partir de name et password retourne un token si les identifiants sont valides | NON    |
| /checkToken   | GET    | vérifie si le token est valide ou non (passé en bearer)                         | REQUIS |
| /logout       | GET    | supprime le token de l'utilisateur                                              | REQUIS |

### Tweets
| Endpoint           | Method | Description                                                            | AUTH   |
| ------------------ | ------ | ---------------------------------------------------------------------- | ------ |
| /tweets            | POST   | poste un tweet (requis content et withComments (parentId facultatif))  | REQUIS |
| /tweets/:id        | DELETE | supprime le tweet demandé                                              | REQUIS |
| /tweets            | GET    | récupère la liste de tweets et retweets                                | REQUIS |
| /tweets/:id        | GET    | récupère les réponses à un tweet à partir de son id                    | REQUIS |
| /accoutsTweets/:id | GET    | récupère la liste des tweets d'un utilisateur                          | REQUIS |
| /myTweets          | GET    | récupère la liste des tweets seulement des utilisateur que vous suivez | REQUIS |

### Retweets
| Endpoint      | Method | Description                                             | AUTH   |
| ------------- | ------ | ------------------------------------------------------- | ------ |
| /retweets     | POST   | effectues un retweet (requis l'id du tweet a retweeter) | REQUIS |
| /retweets/:id | DELETE | supprime un retweet (requis l'id du retweet)            | REQUIS |

### Subscribe
| Endpoint          | Method | Description                                         | AUTH   |
| ----------------- | ------ | --------------------------------------------------- | ------ |
| /isSubscribed/:id | GET    | vérifie si vous suivez le compte donné en ID ou non | REQUIS |
| /subscribe        | POST   | s'abonne au compte (id du compte en body)           | REQUIS |
| /subscribe/:id    | DELETE | se désabonne au compte (id en path)                 | REQUIS |

### Bookmarks
| Endpoint   | Method | Description                                                 | AUTH   |
| ---------- | ------ | ----------------------------------------------------------- | ------ |
| /bookmarks | GET    | retournes les tweets que vous avez enregistrés              | REQUIS |
| /bookmarks | POST   | enregistre un nouveau tweet (tweetId en body)               | REQUIS |
| /bookmarks | DELETE | enlève le tweet de vos tweet enregistrées (tweetId en body) | REQUIS |

### Likes
| Endpoint | Method | Description                                 | AUTH   |
| -------- | ------ | ------------------------------------------- | ------ |
| /like    | POST   | ajoute un j'aime au tweet (tweetId en body) | REQUIS |
| /like    | DELETE | ajoute un j'aime au tweet (tweetId en body) | REQUIS |