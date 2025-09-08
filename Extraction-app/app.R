library(shiny)
library(httr)
library(jsonlite)
library(base64enc)
library(DBI)
library(RPostgres)
library(dplyr)
library(rollama) 

if (file.exists(".RData")) {
  file.remove(".RData")
}

ui <- tagList(
  tags$head(
    tags$meta(charset = "UTF-8"),
    tags$meta(name = "viewport", content = "width=device-width, initial-scale=1.0"),
    tags$title("SHINY APP - Traitement de Tickets"),
    
    tags$script(src = "https://cdn.tailwindcss.com/3.4.16"),
    tags$script(HTML("
      tailwind.config={
          theme:{
              extend:{
                  colors:{
                      primary:'#15b8a6',
                      secondary:'#E67E22',
                      database_save_color: '#00bf63'
                  },
                  borderRadius:{
                      'none':'0px',
                      'sm':'4px',
                      DEFAULT:'8px',
                      'md':'12px',
                      'lg':'16px',
                      'xl':'20px',
                      '2xl':'24px',
                      '3xl':'32px',
                      'full':'9999px',
                      'button':'8px'
                  }
              }
          }
      }
    ")),
    
    tags$script(src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"),
    tags$script(HTML("pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';")),
    
    tags$link(rel = "preconnect", href = "https://fonts.googleapis.com"),
    tags$link(rel = "preconnect", href = "https://fonts.gstatic.com", crossorigin = ""),
    tags$link(href = "https://fonts.googleapis.com/css2?family=Pacifico&display=swap", rel = "stylesheet"),
    
    tags$link(rel = "stylesheet", href = "https://cdnjs.cloudflare.com/ajax/libs/remixicon/4.6.0/remixicon.min.css"),
    
    tags$link(rel = "stylesheet", href = "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css"),
    tags$script(src = "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js"),
    
    tags$link(rel = "stylesheet", type = "text/css", href = "style.css")
  ),
  
  tags$body(class = "min-h-screen",
            tags$header(class = "bg-white shadow-sm",
                        tags$div(class = "container mx-auto px-4 py-3 flex items-center justify-between",
                                 tags$div(class = "flex items-center",
                                          tags$img(src = "Logo.png", alt = "Logo", class = "h-10")
                                 ),
                                 tags$nav(class = "flex space-x-1 bg-gray-100 p-1 rounded-full",
                                          tags$button(id = "tab-pdf", class = "tab-btn px-4 py-2 rounded-full text-sm font-medium bg-white shadow text-gray-800", "Traitement PDF"),
                                          tags$button(id = "tab-extraction", class = "tab-btn px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-gray-800", "Extraction")
                                 )
                        )
            ),
            
            tags$main(class = "container mx-auto px-4 py-8",
                      tags$div(id = "content-pdf", class = "tab-content active",
                               tags$div(class = "max-w-3xl mx-auto",
                                        tags$h2("Découper un PDF en Tickets Images", class = "text-2xl font-semibold text-gray-800 mb-6 text-center"),
                                        tags$div(id = "dropzone", class = "dropzone rounded-lg p-8 mb-6 bg-white flex flex-col items-center justify-center cursor-pointer",
                                                 tags$div(class = "w-16 h-16 flex items-center justify-center bg-gray-50 rounded-full mb-4",
                                                          tags$i(class = "ri-file-pdf-line ri-2x text-gray-400")
                                                 ),
                                                 tags$p("Glissez et déposez votre fichier PDF ici", class = "text-gray-600 mb-2 text-center"),
                                                 tags$p("ou", class = "text-gray-400 text-sm mb-4 text-center"),
                                                 tags$label(`for` = "file-upload", class = "px-4 py-2 bg-gray-100 text-gray-700 rounded-button font-medium hover:bg-gray-200 transition cursor-pointer whitespace-nowrap", "Parcourir..."),
                                                 tags$input(type = "file", id = "file-upload", accept = ".pdf"),
                                                 tags$p("Format accepté: .pdf", class = "text-gray-400 text-xs mt-4")
                                        ),
                                        tags$div(id = "file-info", class = "hidden bg-white p-4 rounded-lg shadow-sm mb-6",
                                                 tags$div(class = "flex items-center",
                                                          tags$div(class = "w-10 h-10 flex items-center justify-center bg-primary bg-opacity-10 rounded-full mr-3",
                                                                   tags$i(class = "ri-file-pdf-line ri-lg text-primary")
                                                          ),
                                                          tags$div(class = "flex-1",
                                                                   tags$p(id = "file-name", class = "font-medium text-gray-700", "document.pdf"),
                                                                   tags$p(id = "file-size", class = "text-sm text-gray-500", "1.2 MB")
                                                          ),
                                                          tags$button(id = "remove-file", class = "w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600",
                                                                      tags$i(class = "ri-close-line")
                                                          )
                                                 )
                                        ),
                                        tags$div(class = "flex justify-center",
                                                 tags$button(id = "process-pdf", class = "px-6 py-3 bg-primary text-white rounded-button font-medium hover:bg-opacity-90 transition flex items-center whitespace-nowrap",
                                                             tags$i(class = "ri-scissors-cut-line mr-2"), "Lancer le découpage du PDF"
                                                 )
                                        ),
                                        tags$div(id = "processing", class = "hidden mt-8",
                                                 tags$div(class = "flex items-center justify-between mb-2",
                                                          tags$p("Traitement en cours...", class = "text-sm font-medium text-gray-700"),
                                                          tags$p(id = "progress-percentage", class = "text-sm text-gray-600", "0%")
                                                 ),
                                                 tags$div(class = "progress-bar",
                                                          tags$div(id = "progress-bar-fill", class = "progress-bar-fill")
                                                 )
                                        ),
                                        tags$div(id = "success-message", class = "hidden mt-8 p-4 bg-green-50 border border-green-100 rounded-lg",
                                                 tags$div(class = "flex",
                                                          tags$div(class = "w-10 h-10 flex items-center justify-center bg-green-100 rounded-full mr-3",
                                                                   tags$i(class = "ri-check-line ri-lg text-green-600")
                                                          ),
                                                          tags$div(
                                                            tags$p("Découpage terminé avec succès!", class = "font-medium text-green-800"),
                                                            tags$p(id = "num-tickets-extracted", class = "text-sm text-green-600", "0 tickets ont été extraits du PDF.")
                                                          )
                                                 )
                                        ),
                                        tags$div(id = "next-step", class = "hidden mt-8 flex justify-center",
                                                 tags$button(id = "go-to-extraction", class = "px-6 py-3 bg-secondary text-white rounded-button font-medium hover:bg-opacity-90 transition flex items-center whitespace-nowrap",
                                                             tags$span("Passer à l'Extraction"),
                                                             tags$i(class = "ri-arrow-right-line ml-2")
                                                 )
                                        )
                               )
                      ),
                      
                      tags$div(id = "content-extraction", class = "tab-content",
                               tags$div(class = "grid grid-cols-1 lg:grid-cols-3 gap-6",
                                        tags$div(class = "bg-white rounded-lg shadow-sm p-4 lg:col-span-1",
                                                 tags$h3("Tickets à traiter", class = "text-lg font-medium text-gray-800 mb-4"),
                                                 tags$div(class = "space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto",
                                                          tags$div(class = "flex items-center justify-between mb-4",
                                                                   tags$button(id = "select-all-tickets", class = "text-sm text-primary hover:opacity-90 flex items-center",
                                                                               tags$i(class = "ri-checkbox-multiple-line mr-1"), "Tout sélectionner"
                                                                   ),
                                                                   tags$button(id = "process-selected", class = "text-sm bg-primary text-white px-3 py-1 rounded-button flex items-center",
                                                                               tags$i(class = "ri-magic-line mr-1"), "Traiter la sélection"
                                                                   )
                                                          ),
                                                          tags$div(id = "tickets-container",
                                                          )
                                                 )
                                        ),
                                        
                                        tags$div(class = "lg:col-span-2 space-y-6",
                                                 tags$div(class = "bg-white rounded-lg shadow-sm p-4",
                                                          tags$div(class = "flex justify-between items-center mb-4",
                                                                   tags$h3("Prévisualisation du ticket", class = "text-lg font-medium text-gray-800"),
                                                                   tags$div(class = "flex space-x-2",
                                                                            tags$button(id = "rotate-left", class = "w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200",
                                                                                        tags$i(class = "ri-anticlockwise-line")
                                                                            ),
                                                                            tags$button(id = "rotate-right", class = "w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200",
                                                                                        tags$i(class = "ri-clockwise-line")
                                                                            ),
                                                                            tags$button(id = "reset-crop", class = "px-3 py-1 bg-gray-100 text-gray-700 rounded-button font-medium hover:bg-gray-200 transition flex items-center whitespace-nowrap text-sm hidden",
                                                                                        tags$i(class = "ri-crop-line mr-1"), "Réinit. Rognage"
                                                                            ),
                                                                            tags$button(id = "save-rotation", class = "w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full hover:bg-opacity-90 hidden",
                                                                                        tags$i(class = "ri-save-line")
                                                                            )
                                                                   )
                                                          ),
                                                          tags$div(class = "border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center p-4", style = "height: 400px;",
                                                                   tags$div(id = "cropper-container", class = "max-h-full max-w-full flex items-center justify-center",
                                                                            tags$img(id = "preview-image", class = "max-h-full object-contain transition-transform duration-300", src = "", style = "transform: rotate(0deg);")
                                                                   )
                                                          )
                                                 ),
                                                 
                                                 tags$div(class = "bg-white rounded-lg shadow-sm p-4",
                                                          tags$h3("Extraction des articles", class = "text-lg font-medium text-gray-800 mb-4"),
                                                          tags$div(id = "extraction-status-area", class = "mb-4 min-h-6 flex items-center",
                                                                   tags$span(id = "extraction-status", class = "text-sm font-medium text-gray-500", "En attente..."),
                                                                   tags$i(id = "extraction-loading-spinner", class = "ri-loader-line ri-spin ml-2 text-primary hidden")
                                                          ),
                                                          
                                                          tags$div(class = "mb-4",
                                                                   tags$label("Prompt d'extraction", class = "block text-sm font-medium text-gray-700 mb-2"),
                                                                   tags$textarea(id = "prompt-input", class = "w-full border border-gray-300 rounded p-3 text-sm focus:outline-none focus:ring-primary focus:border-primary", rows = 8,
                                                                                 paste(
                                                                                   "Voici un ticket de caisse.",
                                                                                   "Retourne tous les articles affichés sur le ticket, sous forme de liste texte.",
                                                                                   "",
                                                                                   "Ignore totalement tout ce qui concerne les promotions, remises, réductions, cartes de fidélité, ainsi que les informations liées au magasin (adresse, SIRET, TVA, totaux, etc.).",
                                                                                   "",
                                                                                   "Pour chaque article :",
                                                                                   "- Utilise uniquement le prix indiqué dans la colonne \"EUR\", qui correspond au prix final total de la ligne. Ignore complètement la colonne \"P.U.EUR\", même si une quantité est mentionnée. Ne fais aucun calcul.",
                                                                                   "- Affiche ce prix avec exactement deux chiffres après la virgule, suivi du symbole euro \"€\" (ex. \"2,95€\").",
                                                                                   "- Reprends le nom exact de l’article tel qu’il apparaît sur le ticket, sans aucune modification, correction, interprétation ou reformulation. Cela inclut les majuscules, fautes éventuelles, accents, abréviations, et ponctuation.",
                                                                                   "- Ne me renvoie pas les catégories qui sont généralement en gras juste l'article et son prix",
                                                                                   "",
                                                                                   "Réponds uniquement avec une liste texte au format suivant (sans aucun ajout) :",
                                                                                   "",
                                                                                   "Nom exact du produit | X,XX €",
                                                                                   "... | ...",
                                                                                   sep = "\n"
                                                                                 )
                                                                   )
                                                          ),
                                                          tags$div(class = "flex justify-center mb-6",
                                                                   tags$button(id = "start-extraction", class = "px-5 py-2 bg-primary text-white rounded-button font-medium hover:bg-opacity-90 transition flex items-center whitespace-nowrap",
                                                                               tags$i(class = "ri-magic-line mr-2"), "Lancer l'extraction sur le ticket affiché"
                                                                   )
                                                          ),
                                                          tags$div(class = "bg-gray-50 rounded-lg shadow-sm p-6",
                                                                   tags$div(class = "mb-6",
                                                                            tags$h3("Résultats de l'extraction", class = "text-lg font-medium text-gray-800 mb-2")
                                                                   ),
                                                                   tags$div(class = "mb-4",
                                                                            tags$textarea(id = "extraction-results", class = "w-full h-64 p-4 border border-gray-200 rounded-lg bg-white text-gray-800 font-mono text-sm", readonly = "", "")
                                                                   ),
                                                                   tags$div(class = "flex justify-end space-x-3",
                                                                            tags$button(id = "copy-results", class = "px-4 py-2 bg-gray-100 text-gray-700 rounded-button font-medium hover:bg-gray-200 transition flex items-center whitespace-nowrap",
                                                                                        tags$i(class = "ri-file-copy-line mr-2"), "Copier"
                                                                            ),
                                                                            tags$button(id = "save-results", class = "px-4 py-2 bg-database_save_color text-white rounded-button font-medium hover:opacity-90 transition flex items-center whitespace-nowrap",
                                                                                        tags$i(class = "ri-save-line mr-2"), "Enregistrer BDD"
                                                                            ),
                                                                            tags$button(id = "download-csv", class = "px-4 py-2 bg-primary text-white rounded-button font-medium hover:bg-opacity-90 transition flex items-center whitespace-nowrap",
                                                                                        tags$i(class = "ri-file-excel-line mr-2"), "CSV"
                                                                            ),
                                                                            tags$button(id = "download-txt", class = "px-4 py-2 bg-primary text-white rounded-button font-medium hover:bg-opacity-90 transition flex items-center whitespace-nowrap",
                                                                                        tags$i(class = "ri-file-text-line mr-2"), "TXT"
                                                                            )
                                                                   )
                                                          )
                                                 )
                                        )
                               )
                      )
            )
            
  ),
  tags$script(src = "script.js")
)

server <- function(input, output, session) {
  db_conn <- reactiveVal(NULL)
  ref_articles_embeddings <- reactiveVal(NULL) 
  
  observeEvent(session, {
    if (is.null(db_conn())) {
      tryCatch({
        con <- dbConnect(
          RPostgres::Postgres(),
          dbname = "db",
          host = "localhost",
          port = XXX,
          user = "User",
          password = "XXXXX"
        )
        db_conn(con)
        message("Connexion à la base de données PostgreSQL 'admin' réussie.")
        session$sendCustomMessage('showNotification', list(message = 'Connecté à la base de données admin.', type = 'success'))
        
        articles_ref_data <- dbReadTable(con, "articles_ref")
        articles_ref_data$embedding_vec <- lapply(articles_ref_data$embedding, function(x) {
          as.numeric(strsplit(gsub("\\[|\\]", "", x), ",")[[1]])
        })
        ref_articles_embeddings(articles_ref_data)
        
        message("Base de référence des articles et embeddings chargée.")
      }, error = function(e) {
        message("Échec de la connexion à la base de données PostgreSQL : ", e$message)
        session$sendCustomMessage('showNotification', list(message = paste('Erreur de connexion à la base de données :', e$message), type = 'error'))
        db_conn(NULL)
      })
    }
  }, ignoreNULL = FALSE, once = TRUE)
  
  onStop(function() {
    con <- db_conn()
    if (!is.null(con) && dbIsValid(con)) {
      dbDisconnect(con)
      message("Déconnecté de la base de données PostgreSQL.")
    }
  })
  
  
  categories_alimentaires <- c(
    "Produits gras sucrés", "Féculents raffinés", "Sauces", "Poisson",
    "Matières grasses végétales", "Plats préparés végétariens", "Légumes",
    "Condiments et autres", "Snacks salés", "Fruits", "Féculents non raffinés",
    "Boissons sucrées", "Charcuterie", "Alcool", "Plats préparés viande/poisson",
    "Autre viande rouge", "Thé, café", "Volaille, lapin", "Lait et yaourt",
    "oeuf", "Matières grasses animales", "Viande de ruminant"
  )
  
  
  SIMILARITY_THRESHOLD <- 0.35
  
  classify_article <- function(article_name, current_db_conn, session_obj, ref_articles_data) {
    classified_category <- NA_character_
    
    
    tryCatch({
      options(rollama_server = "http://iut-sd2.univ-avignon.fr:11434")
      article_embedding <- embed_text(article_name, model = "nomic-embed-text")
      article_embedding_str <- paste0("[", paste(article_embedding, collapse = ","), "]")
      
      knn_result <- dbGetQuery(current_db_conn, 
                               sprintf("SELECT article, distance, categorie FROM knn_articles('%s'::vector, 1);", 
                                       article_embedding_str))
      
      if (nrow(knn_result) > 0) {
        closest_distance <- knn_result$distance[1]
        closest_category <- knn_result$categorie[1]
        
        if (closest_distance <= SIMILARITY_THRESHOLD) {
          classified_category <- closest_category
          message(paste("Classifié (Similarité Vectorielle):", article_name, "->", classified_category, "(Distance:", closest_distance, ")"))
          session_obj$sendCustomMessage('showNotification', list(message = paste('Classifié par SV:', article_name), type = 'info', duration = 2000))
        } else {
          message(paste("Similarité Vectorielle insuffisante pour:", article_name, "(Distance:", closest_distance, ">", SIMILARITY_THRESHOLD, ")"))
        }
      } else {
        message(paste("Aucun voisin trouvé par Similarité Vectorielle pour:", article_name))
      }
    }, error = function(e) {
      warning(paste("Erreur lors de la classification par similarité vectorielle pour", article_name, ":", e$message))
    })
    
    if (is.na(classified_category) || is.null(classified_category) || nchar(trimws(classified_category)) == 0) {
      tryCatch({
        options(rollama_server = "http://iut-sd2.univ-avignon.fr:11434")
        options(rollama_model = "gemma3") 
        
        prompt <- paste(
          "Tu es un expert en nutrition.",
          "Tu dois classifier le produit suivant dans une des catégories alimentaires suivantes, si c'est bien un aliment :",
          paste(categories_alimentaires, collapse = " ; "),
          "---",
          "Produit :", article_name,
          "---",
          "Si ce n'est pas un article alimentaire, réponds exactement : NON ALIMENTAIRE.",
          "Sinon, réponds uniquement avec le nom exact de la catégorie (sans rien d'autre)."
        )
        
        resp <- query(prompt, screen = FALSE)
        llm_category <- trimws(paste(resp, collapse = " "))
        
        if (nchar(llm_category) > 0 && llm_category %in% categories_alimentaires) {
          classified_category <- llm_category
          message(paste("Classifié (LLM Fallback):", article_name, "->", classified_category))
          session_obj$sendCustomMessage('showNotification', list(message = paste('Classifié par LLM:', article_name), type = 'info', duration = 2000))
        } else if (llm_category == "NON ALIMENTAIRE") {
          classified_category <- "NON ALIMENTAIRE"
          message(paste("Classifié (LLM Fallback):", article_name, "-> NON ALIMENTAIRE"))
          session_obj$sendCustomMessage('showNotification', list(message = paste('Classifié par LLM:', article_name, ' (Non-Alimentaire)'), type = 'info', duration = 2000))
        } else {
          message(paste("LLM n'a pas pu classer l'article ou a donné une catégorie non valide:", article_name, "->", llm_category))
        }
      }, error = function(e) {
        warning(paste("Erreur lors de la classification LLM pour", article_name, ":", e$message))
      })
    }
    
    if (is.na(classified_category) || is.null(classified_category) || nchar(trimws(classified_category)) == 0 || !classified_category %in% c(categories_alimentaires, "NON ALIMENTAIRE")) {
      classified_category <- "NON ALIMENTAIRE"
      message(paste("Classification finale (par défaut):", article_name, "-> NON ALIMENTAIRE"))
      session_obj$sendCustomMessage('showNotification', list(message = paste('Classifié (Défaut):', article_name, ' (Non-Alimentaire)'), type = 'warning', duration = 2000))
    }
    
    return(classified_category)
  }
  
  
  insert_into_db <- function(response_text, ticket_idx, household_code, ticket_number, session_obj, current_db_conn) {
    con <- current_db_conn
    if (is.null(con) || !dbIsValid(con)) {
      session_obj$sendCustomMessage('showNotification', list(message = 'Non connecté à la base de données. Impossible d\'enregistrer.', type = 'error'))
      return(FALSE)
    }
    
    tryCatch({
      lines <- strsplit(response_text, "\n")[[1]]
      lines <- lines[nchar(trimws(lines)) > 0 & !startsWith(trimws(lines), "---") & !startsWith(trimws(lines), "Erreur:")]
      
      if (length(lines) == 0) {
        session_obj$sendCustomMessage('showNotification', list(message = paste('Aucun article parsable trouvé pour le ticket #', ticket_idx + 1, '.'), type = 'warning'))
        return(TRUE)
      }
      
      articles_to_process <- data.frame(articles = character(), prix = numeric(), stringsAsFactors = FALSE)
      
      for (line in lines) {
        parts <- strsplit(line, "\\|")[[1]]
        if (length(parts) >= 2) {
          article <- trimws(parts[1])
          prix_str <- trimws(parts[2])
          prix_numeric <- as.numeric(gsub(",", ".", gsub("[^0-9,.]", "", prix_str)))
          
          if (nchar(article) > 0 && !is.na(prix_numeric)) {
            articles_to_process <- rbind(articles_to_process, data.frame(articles = article, prix = prix_numeric, stringsAsFactors = FALSE))
          } else {
            warning(paste("Ligne ignorée en raison d'un format ou d'un prix invalide pour le ticket", ticket_idx + 1, ":", line))
          }
        } else {
          warning(paste("Ligne ignorée en raison d'un délimiteur '|' incorrect pour le ticket", ticket_idx + 1, ":", line))
        }
      }
      
      if (nrow(articles_to_process) > 0) {
        articles_to_process$no_tickets <- ticket_number
        articles_to_process$menages <- household_code
        articles_to_process$categorie <- NA_character_ 
        
        for (i in 1:nrow(articles_to_process)) {
          current_article_name <- articles_to_process$articles[i]
          
          classified_category <- classify_article(current_article_name, current_db_conn, session_obj, ref_articles_embeddings())
          articles_to_process$categorie[i] <- classified_category
        }
        
        for (i in 1:nrow(articles_to_process)) {
          dbExecute(con, "INSERT INTO items (articles, prix, no_tickets, menages, categorie) VALUES ($1, $2, $3, $4, $5);",
                    params = list(articles_to_process$articles[i], 
                                  articles_to_process$prix[i],
                                  articles_to_process$no_tickets[i],
                                  articles_to_process$menages[i],
                                  articles_to_process$categorie[i]
                    ))
        }
        session_obj$sendCustomMessage('showNotification', list(message = paste('Articles du ticket #', ticket_idx + 1, ' enregistrés dans la BDD.', sep=''), type = 'success'))
      } else {
        session_obj$sendCustomMessage('showNotification', list(message = paste('Aucun article valide à enregistrer pour le ticket #', ticket_idx + 1, '.', sep=''), type = 'warning'))
      }
      return(TRUE)
      
    }, error = function(e) {
      session_obj$sendCustomMessage('showNotification', list(message = paste('Erreur BDD (Ticket #', ticket_idx + 1, ') :', e$message), type = 'error'))
      warning(paste("Erreur d'insertion dans la base de données pour le ticket", ticket_idx + 1, ":", e$message))
      return(FALSE)
    })
  }
  
  observeEvent(input$ocrRequest, {
    req(input$ocrRequest$images, input$ocrRequest$prompt, input$ocrRequest$indices, input$ocrRequest$householdCode, input$ocrRequest$ticketNumbers)
    
    images_base64 <- input$ocrRequest$images
    prompt_text <- input$ocrRequest$prompt
    ticket_indices <- input$ocrRequest$indices
    household_code <- input$ocrRequest$householdCode
    ticket_numbers <- input$ocrRequest$ticketNumbers
    
    results <- list()
    
    session$sendCustomMessage('updateExtractionStatus', list(status = paste('Traitement de', length(images_base64), 'ticket(s)...'), color = 'blue', loading = TRUE))
    
    for (i in seq_along(images_base64)) {
      img_base64 <- images_base64[[i]]
      current_index <- ticket_indices[[i]]
      current_ticket_number_formatted <- ticket_numbers[[i]]
      
      session$sendCustomMessage("updateTicketStatus", list(index = current_index, status = "Traitement...", processing = TRUE))
      
      res <- tryCatch(
        POST("http://iut-sd2.univ-avignon.fr:11434/api/generate",
             encode = "json",
             body = list(
               model  = "llama4",
               prompt = prompt_text,
               images = list(img_base64),
               stream = FALSE
             )),
        error = function(e) e
      )
      
      if (inherits(res, "error") || status_code(res) != 200) {
        err_msg <- if (inherits(res, "error")) e$message else paste0("Erreur HTTP : ", status_code(res))
        session$sendCustomMessage("updateTicketStatus", list(index = current_index, status = "Erreur", error = TRUE))
        results[[as.character(current_index)]] <- paste("--- Erreur Ticket #", current_index + 1, " ---\n", err_msg, "\n")
        
      } else {
        api_body <- content(res)
        response_text <- api_body$response
        if (is.null(response_text)) {
          response_text <- paste("L'API n'a pas renvoyé de champ 'response'. Corps complet :", jsonlite::toJSON(api_body, auto_unbox = TRUE, pretty = TRUE))
          session$sendCustomMessage("updateTicketStatus", list(index = current_index, status = "API Invalide", error = TRUE))
        } else if (response_text == "") {
          response_text <- "Pas d'articles trouvés (Réponse vide)."
          session$sendCustomMessage("updateTicketStatus", list(index = current_index, status = "Aucun Article", success = TRUE))
        }
        else {
          session$sendCustomMessage("updateTicketStatus", list(index = current_index, status = "Terminé", success = TRUE))
          insert_into_db(response_text, current_index, household_code, current_ticket_number_formatted, session, db_conn())
        }
        
        results[[as.character(current_index)]] <- paste0("--- Résultat Ticket #", current_index + 1, " ---\n", response_text, "\n")
      }
    }
    
    ordered_results <- results[order(as.numeric(names(results)))]
    combined_output <- paste(unlist(ordered_results), collapse = "\n\n")
    
    session$sendCustomMessage("ocrResponse", list(response = combined_output))
    
    all_successful <- all(sapply(ticket_indices, function(idx) {
      res_text <- results[[as.character(idx)]]
      !is.null(res_text) && !grepl("^--- Erreur", res_text) && !grepl("API Invalide", res_text)
    }))
    
    final_status_color <- if (all_successful) 'green' else 'red'
    final_status_text <- if (all_successful) 'Extraction terminée avec succès.' else 'Extraction terminée (avec erreurs).'
    
    session$sendCustomMessage('updateExtractionStatus', list(status = final_status_text, color = final_status_color, loading = FALSE))
    
  })
  
  observeEvent(input$extractSingleTicket, {
    req(input$extractSingleTicket$image, input$extractSingleTicket$prompt, input$extractSingleTicket$index, input$extractSingleTicket$householdCode, input$extractSingleTicket$ticketNumber)
    
    img_base64 <- input$extractSingleTicket$image
    prompt_text <- input$extractSingleTicket$prompt
    current_index <- input$extractSingleTicket$index
    household_code <- input$extractSingleTicket$householdCode
    ticket_number <- input$extractSingleTicket$ticketNumber
    
    session$sendCustomMessage("updateTicketStatus", list(index = current_index, status = "Traitement...", processing = TRUE))
    session$sendCustomMessage("updateExtractionStatus", list(status = "Traitement du ticket...", color = "blue", loading = TRUE))
    
    res <- tryCatch(
      POST("http://iut-sd2.univ-avignon.fr:11434/api/generate",
           encode = "json",
           body = list(
             model  = "llama4",
             prompt = prompt_text,
             images = list(img_base64),
             stream = FALSE
           )),
      error = function(e) e
    )
    
    if (inherits(res, "error") || status_code(res) != 200) {
      err_msg <- if (inherits(res, "error")) e$message else paste0("Erreur HTTP : ", status_code(res))
      session$sendCustomMessage("updateTicketStatus", list(index = current_index, status = "Erreur", error = TRUE))
      session$sendCustomMessage("updateExtractionStatus", list(status = paste("Échec de l'extraction :", err_msg), color = "red", loading = FALSE))
      session$sendCustomMessage("ocrSingleResponse", list(response = paste("Erreur lors du traitement du Ticket #", current_index + 1, ": ", err_msg), index = current_index, status = "Erreur"))
    } else {
      api_body <- content(res)
      response_text <- api_body$response
      if (is.null(response_text)) {
        response_text <- paste("L'API n'a pas renvoyé de champ 'response'. Corps complet :", jsonlite::toJSON(api_body, auto_unbox = TRUE, pretty = TRUE))
        session$sendCustomMessage("updateTicketStatus", list(index = current_index, status = "API Invalide", error = TRUE))
        session$sendCustomMessage("updateExtractionStatus", list(status = "Extraction échouée (API Invalide).", color = "red", loading = FALSE))
        session$sendCustomMessage("ocrSingleResponse", list(response = response_text, index = current_index, status = "API Invalide"))
      } else if (response_text == "") {
        response_text <- "Pas d'articles trouvés (Réponse vide)."
        session$sendCustomMessage("updateTicketStatus", list(index = current_index, status = "Aucun Article", success = TRUE))
        session$sendCustomMessage("updateExtractionStatus", list(status = "Extraction terminée (Aucun Article).", color = "green", loading = FALSE))
        session$sendCustomMessage("ocrSingleResponse", list(response = response_text, index = current_index, status = "Aucun Article"))
      }
      else {
        session$sendCustomMessage("updateTicketStatus", list(index = current_index, status = "Terminé", success = TRUE))
        session$sendCustomMessage("updateExtractionStatus", list(status = "Extraction réussie.", color = "green", loading = FALSE))
        session$sendCustomMessage("ocrSingleResponse", list(response = response_text, index = current_index, status = "Terminé"))
        insert_into_db(response_text, current_index, household_code, ticket_number, session, db_conn())
      }
    }
  })
  
  observeEvent(input$manualSaveExtractedResults, {
    req(input$manualSaveExtractedResults$results, input$manualSaveExtractedResults$householdCode, input$manualSaveExtractedResults$ticketNumber)
    results_to_save <- input$manualSaveExtractedResults$results
    ticket_index <- input$manualSaveExtractedResults$ticketIndex
    household_code <- input$manualSaveExtractedResults$householdCode
    ticket_number <- input$manualSaveExtractedResults$ticketNumber
    
    message(paste("Sauvegarde manuelle demandée pour le ticket #", ticket_index + 1))
    insert_into_db(results_to_save, ticket_index, household_code, ticket_number, session, db_conn())
  })
}
shinyApp(ui, server)