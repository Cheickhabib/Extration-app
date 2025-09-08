

# Application d'extraction d'informations

Cette application a été conçue pour automatiser le processus d'extraction de données à partir de pdf. L'objectif principal est de récupérer de manière fiable des informations clés, afin de faciliter l'analyse de vastes ensembles de données transactionnelles.

### Flexibilité du système d'extraction et de classification

La puissance de ce système réside dans sa flexibilité. Grâce à l'utilisation d'un Grand Modèle de Langage Multimodal, l'extraction de données n'est pas limitée aux seules informations d'un reçu. On peut extraire n'importe quelle information présente sur une image en ajustant le prompt (la requête) envoyé au modèle. Par exemple, si vous avez un bulletin de notes, vous pourriez demander au système d'extraire toutes les notes en lui donnant un prompt tel que : "Extrais toutes les notes de ce document". Le modèle identifiera et extraira les données tant que l'information est visuellement présente.

Il est crucial de noter que cette étape d'extraction est complètement dissociée du système de classification. La classification par catégorie a été développée spécifiquement pour un projet où l'organisme client avait besoin de classer les articles extraits des reçus en catégories prédéfinies (comme 'Boissons' ou 'Légumes'). Ainsi, le système peut être utilisé uniquement pour l'extraction de données brutes, ou l'on peut y ajouter une couche de classification pour organiser les informations selon des besoins spécifiques.


## Fonctionnalités Clés

- Extraction Automatique par IA : L'application utilise un Grand Modèle de Langage Multimodal (GMLM), llama4:scout, pour son moteur d'extraction. Ce modèle est déployé via une API et est capable de lire à la fois du texte et des images, ce qui lui permet d'interpréter le contenu des reçus avec une grande précision.

- Flux de travail de l'extraction : L'interface utilisateur, développée avec R Shiny, est divisée en plusieurs sections pour guider l'utilisateur à travers le processus :
  - Traitement des PDF : Un outil intégré permet de convertir des fichiers PDF contenant plusieurs reçus en une série d'images individuelles.
  - Gestion des images : L'utilisateur peut prévisualiser, recadrer et faire pivoter chaque image de reçu pour optimiser la qualité avant l'extraction.
  - Personnalisation des requêtes : Il est possible de modifier la requête d'extraction pour affiner les résultats.

- Contrôle Qualité et Évaluation des Performances : Afin de garantir la fiabilité des données extraites, un système d'évaluation a été mis en place :
  - Score de Qualité Initial : Chaque reçu peut être classé manuellement avec un score de qualité allant de 1 à 5 pour anticiper la difficulté d'extraction.
  - Classification des erreurs : Le système a été évalué en classant les erreurs en cinq catégories de gravité, de Faible à Catastrophique.
  - Évaluation des performances : La performance a été mesurée en comparant les résultats de l'extraction sur un large éventail de reçus, en identifiant les types d'erreurs les plus fréquents et les points à améliorer.



## Technologie

- Interface utilisateur : R Shiny
- Traitement des PDF : pdf.js
- Gestion des images : Cropper.js
- Modèle d'extraction : llama4:scout 



## Auteur

- Développeur : Aidara Cheick Habib
- Projet : Documenté le 22 mai 2025

## Licence
Ce projet est sous licence GNU General Public License v3.0. Voir le fichier [LICENSE](LICENSE) pour plus de détails.