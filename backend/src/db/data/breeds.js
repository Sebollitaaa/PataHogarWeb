/**
 * Catálogo de razas de PataHogar.
 *
 * Una línea por raza, con el formato:
 *     Nombre usado en Argentina | Título del artículo en Wikipedia (inglés) | alias de búsqueda, separados por coma
 *
 * - El nombre es el que se muestra y se guarda. Para razas conocidas por su nombre
 *   extranjero ("Golden Retriever", "Beagle") se deja el original; para las que en
 *   Argentina se dicen en castellano ("Caniche", "Pastor Alemán") se usa ese nombre.
 * - El título de Wikipedia es opcional (si se omite se usa el nombre) y sirve solo
 *   para descargar la miniatura; no afecta a la búsqueda.
 * - Los alias son los otros nombres con que la gente la busca ("Poodle" → Caniche).
 *
 * Para agregar o corregir razas basta con editar este archivo: el servidor lo
 * sincroniza con la base de datos al iniciar (ver breedCatalogService).
 */

const GENERIC_NAME = 'Mestizo / sin raza definida';
const GENERIC_ALIASES = 'mestizo, mestiza, mezcla, cruza, cruce, sin raza, callejero, callejera, criollo, criolla, quiltro';

const RAW = {
  perro: `
Affenpinscher
Afgano | Afghan Hound | Afghan Hound, galgo afgano
Airedale Terrier | | Airedale
Akita Inu | Akita Inu | Akita, akita japonés
Akita Americano | Akita (dog breed) | American Akita
Alaskan Malamute | Alaskan Malamute | Malamute
Alano Español | Alano Español | Alano
American Staffordshire Terrier | | Amstaff, American Staff
American Bully | American Bully | Bully
Basenji
Basset Hound | | Basset
Basset Azul de Gascuña | Blue Gascony Basset | Basset azul
Beagle
Bearded Collie | | Collie barbudo
Bichón Boloñés | Bolognese dog | Bolognese
Bichón Frisé | Bichon Frise | Bichon frise
Bichón Habanero | Havanese dog | Havanés, Havanese
Bichón Maltés | Maltese dog | Maltés, Maltese
Bloodhound | | Perro de San Huberto, sabueso de San Huberto
Border Collie
Border Terrier
Borzoi | | Galgo ruso, barzoi
Boston Terrier
Boxer | Boxer (dog)
Boyero de Berna | Bernese Mountain Dog | Bernese, Bernés de la montaña
Boyero de Flandes | Bouvier des Flandres | Bouvier
Boyero Australiano | Australian Cattle Dog | Blue Heeler, Cattle dog, Perro boyero australiano
Boyero de Appenzell | Appenzeller Sennenhund | Appenzeller
Braco Alemán | German Shorthaired Pointer | Pointer alemán, Kurzhaar
Braco de Weimar | Weimaraner | Weimaraner
Braco Húngaro | Vizsla | Vizsla
Bulldog Francés | French Bulldog | Frenchie, Bulldog frances
Bulldog Inglés | English Bulldog | Bulldog, Bulldog ingles
Bulldog Americano | American Bulldog
Bulldog Campeiro | Campeiro Bulldog
Bullmastiff
Bull Terrier | | Bull terrier ingles
Bull Terrier Miniatura | Miniature Bull Terrier | Mini bull terrier
Cairn Terrier
Cane Corso | | Dogo italiano, Mastín italiano
Carlino | Pug | Pug
Caniche | Poodle | Poodle, caniche toy, caniche mediano, caniche gigante
Caniche Toy | Poodle | Poodle toy, Caniche enano
Cavalier King Charles Spaniel | | Cavalier, King Charles
Chihuahua | Chihuahua (dog)
Chow Chow
Cimarrón Uruguayo | Cimarrón Uruguayo | Cimarron
Cocker Spaniel Inglés | English Cocker Spaniel | Cocker, Cocker ingles
Cocker Spaniel Americano | American Cocker Spaniel | Cocker americano
Collie | Rough Collie | Collie de pelo largo, Lassie
Collie de Pelo Corto | Smooth Collie
Coton de Tuléar | Coton de Tuléar
Crestado Chino | Chinese Crested Dog | Chinese crested
Dálmata | Dalmatian (dog) | Dalmatian, Dalmata
Dandie Dinmont Terrier
Deerhound | Scottish Deerhound | Galgo escocés
Dobermann | Dobermann | Doberman, Doberman Pinscher
Dogo Argentino | Dogo Argentino | Dogo
Dogo de Burdeos | Dogue de Bordeaux | Dogue de Bordeaux, Mastín de Burdeos
Eurasier
Fila Brasileiro | Fila Brasileiro | Fila brasilero
Fox Terrier Pelo Duro | Wire Fox Terrier | Fox terrier
Fox Terrier Pelo Liso | Smooth Fox Terrier | Fox terrier
Foxhound Inglés | English Foxhound
Galgo Español | Galgo Español | Galgo
Galgo Inglés | Greyhound | Greyhound
Galgo Italiano | Italian Greyhound | Italian greyhound, Piccolo levriero
Golden Retriever | | Golden
Gran Danés | Great Dane | Gran danes, Dogo alemán, Great Dane
Griffon de Bruselas | Griffon Bruxellois | Brussels griffon, Grifón
Husky Siberiano | Siberian Husky | Husky, Siberian husky
Irish Wolfhound | | Lobero irlandés
Jack Russell Terrier | | Jack Russell, Parson russell
Parson Russell Terrier | Parson Russell Terrier
Kuvasz
Labradoodle
Labrador Retriever | | Labrador
Leonberger
Lhasa Apso | | Lhasa
Mastín Napolitano | Neapolitan Mastiff | Mastino, Mastín italiano
Mastín Inglés | English Mastiff | Mastiff
Mastín de los Pirineos | Pyrenean Mastiff | Mastín pirenaico
Mini Pinscher | Miniature Pinscher | Pinscher miniatura, Min pin, Pinscher
Newfoundland | | Terranova
Norfolk Terrier
Norwich Terrier
Old English Sheepdog | | Bobtail, Pastor inglés antiguo
Papillón | Papillon (dog) | Papillon
Pastor Alemán | German Shepherd | German shepherd, Ovejero alemán, Ovejero aleman
Pastor Australiano | Australian Shepherd | Aussie, Australian shepherd
Pastor Belga Malinois | Belgian Shepherd
Pastor Belga Groenendael | Groenendael
Pastor Belga Tervueren | Tervuren
Pastor Blanco Suizo | White Swiss Shepherd Dog | Pastor suizo
Pastor Catalán | Catalan Sheepdog | Gos d'atura
Pastor de Beauce | Beauceron | Beauceron
Pastor de Brie | Briard | Briard
Pastor de los Pirineos | Pyrenean Shepherd
Pastor de Shetland | Shetland Sheepdog | Sheltie, Shetland sheepdog
Pastor Holandés | Dutch Shepherd
Pastor Maremmano | Maremma Sheepdog | Maremmano, Pastor de Abruzzo
Pastor Polaco de las Llanuras | Polish Lowland Sheepdog | PON
Pekinés | Pekingese | Pekines, Pekingese
Perro de Agua Español | Spanish Water Dog
Perro de Agua Portugués | Portuguese Water Dog | Portuguese water dog
Perro de Agua Irlandés | Irish Water Spaniel
Perro Lobo Checoslovaco | Czechoslovakian Wolfdog | Lobo checoslovaco
Perro Lobo de Saarloos | Saarloos Wolfdog
Perro de Montaña de los Pirineos | Great Pyrenees | Gran pirineo
Perro Pastor de Anatolia | Anatolian Shepherd Dog | Kangal
Perro Peruano sin Pelo | Peruvian Hairless Dog | Viringo, Perro sin pelo del Perú
Perro sin Pelo Mexicano | Xoloitzcuintle | Xolo, Xoloitzcuintle
Perro de Presa Mallorquín | Ca de Bou | Ca de bou
Perro Salchicha | Dachshund | Dachshund, Teckel, Salchicha
Pinscher | German Pinscher | Pinscher alemán
Pinscher Austriaco | Austrian Pinscher
Pit Bull Terrier | American Pit Bull Terrier | Pitbull, Pit bull, American pit bull
Podenco Ibicenco | Ibizan Hound | Podenco
Pointer Inglés | Pointer (dog breed) | Pointer
Pomerania | Pomeranian dog | Pomerania, Spitz enano, Pomeranian, Lulú de pomerania
Pomsky
Presa Canario | Presa Canario
Puli | Puli (dog)
Pumi | Pumi (dog)
Rhodesian Ridgeback | | Ridgeback
Rottweiler | | Rotweiler
Saint Bernard | Saint Bernard (dog) | San Bernardo, Sanbernardo
Saluki | | Galgo persa
Samoyedo | Samoyed dog | Samoyed
Schnauzer Miniatura | Miniature Schnauzer | Schnauzer, Schnauzer mini, Schnauzer enano
Schnauzer Mediano | Standard Schnauzer | Schnauzer
Schnauzer Gigante | Giant Schnauzer | Schnauzer
Scottish Terrier | | Scottie
Sealyham Terrier
Segugio Italiano | Segugio Italiano
Setter Inglés | English Setter | English setter
Setter Irlandés | Irish Setter | Irish setter, Setter rojo
Setter Gordon | Gordon Setter | Gordon
Shar Pei | Shar Pei | Sharpei
Shiba Inu | | Shiba
Shih Tzu | | Shihtzu, Shit-zu, Shih-tzu
Silky Terrier | Australian Silky Terrier
Skye Terrier
Spaniel Bretón | Brittany (dog) | Breton, Brittany
Spaniel Japonés | Japanese Chin | Chin japonés
Spitz Alemán | German Spitz | Spitz
Spitz Japonés | Japanese Spitz
Spitz Finlandés | Finnish Spitz
Springer Spaniel Inglés | English Springer Spaniel | Springer
Staffordshire Bull Terrier | | Staffy, Staffordshire
Swedish Vallhund | Swedish Vallhund | Vallhund sueco
Terrier Brasileño | Brazilian Terrier | Fox paulistinha
Terrier Escocés | Scottish Terrier
Terrier Irlandés | Irish Terrier
Terrier Tibetano | Tibetan Terrier
Tosa Inu | Tosa (dog) | Tosa
Weimaraner
Welsh Corgi Pembroke | Pembroke Welsh Corgi | Corgi, Corgi pembroke
Welsh Corgi Cardigan | Cardigan Welsh Corgi | Corgi cardigan
Welsh Terrier
West Highland White Terrier | | Westie, West highland, Terrier blanco
Whippet
Yorkshire Terrier | | Yorkie, Yorkshire
Pastor Garafiano | Garafiano Shepherd
Sabueso de Hamilton | Hamiltonstövare
Sabueso Suizo | Swiss Hound
Sabueso Español | Spanish Hound
Cazador de Alces Noruego | Norwegian Elkhound | Elkhound
Lundehund Noruego | Norwegian Lundehund
Keeshond | | Wolfspitz
Pastor de Islandia | Icelandic Sheepdog | Perro islandés
Perro de Osos de Carelia | Karelian Bear Dog
Laika Siberiano Oriental | East Siberian Laika | Laika
Laika de Siberia Occidental | West Siberian Laika | Laika
Spitz de Norbotten | Norrbottenspets
Chart Polski | Polish Greyhound
Sloughi
Azawakh
Pharaoh Hound | Pharaoh Hound | Perro del Faraón
Cirneco del Etna | Cirneco dell'Etna
Podenco Canario | Podenco Canario
Podenco Portugués | Portuguese Podengo | Podengo
Perdiguero de Burgos | Burgos Pointer
Perdiguero Portugués | Portuguese Pointer
Braco Italiano | Bracco Italiano
Braco de Saint Germain | Braque Saint-Germain
Braco Francés | Braque Français
Spinone Italiano | Spinone Italiano | Spinone
Pointer Alemán de Pelo Duro | German Wirehaired Pointer | Drahthaar
Pudelpointer
Griffon Korthals | Wirehaired Pointing Griffon | Korthals
Retriever de Pelo Rizado | Curly-coated Retriever
Retriever de Pelo Liso | Flat-coated Retriever
Chesapeake Bay Retriever | Chesapeake Bay Retriever | Chesapeake
Nova Scotia Duck Tolling Retriever | Nova Scotia Duck Tolling Retriever | Toller
Cocker Spaniel de Sussex | Sussex Spaniel
Field Spaniel
Clumber Spaniel | Clumber Spaniel | Clumber
Welsh Springer Spaniel
Kooikerhondje
Lagotto Romagnolo | Lagotto Romagnolo | Lagotto
Barbet | Barbet (dog)
Wetterhoun
Pastor de Bergamo | Bergamasco Shepherd | Bergamasco
Komondor
Kelpie Australiano | Australian Kelpie | Kelpie
Pastor Croata | Croatian Sheepdog
Cão de Fila de São Miguel | Cão Fila de São Miguel
Rafeiro do Alentejo | Rafeiro do Alentejo
Cão da Serra da Estrela | Estrela Mountain Dog | Estrela
Cão de Castro Laboreiro | Castro Laboreiro Dog
Boerboel
Mastín Tibetano | Tibetan Mastiff
Kangal | Kangal Shepherd Dog
Pastor de Karst | Karst Shepherd
Pastor de Sarplaninac | Šarplaninac | Sarplaninac
Ovtcharka del Cáucaso | Caucasian Shepherd Dog | Pastor del Cáucaso
Ovtcharka de Asia Central | Central Asian Shepherd Dog
Perro de Montaña del Atlas | Aidi
Pastor Mallorquín | Ca de Bestiar
Perro Cretense | Cretan Hound
Terrier de Manchester | Manchester Terrier
Terrier de Lakeland | Lakeland Terrier | Lakeland
Terrier de Bedlington | Bedlington Terrier | Bedlington
Terrier Kerry Blue | Kerry Blue Terrier | Kerry blue
Terrier Irlandés de Pelo Suave | Soft-coated Wheaten Terrier | Wheaten
Terrier Glen of Imaal | Glen of Imaal Terrier
Terrier de Cesky | Cesky Terrier
Terrier Alemán de Caza | German Hunting Terrier | Jagdterrier
Terrier Ruso Negro | Black Russian Terrier
Terrier Japonés | Japanese Terrier | Nihon teria
Terrier Australiano | Australian Terrier
Terrier de Patterdale | Patterdale Terrier
Rat Terrier | Rat Terrier
Toy Fox Terrier
Bulldog Antiguo | Olde English Bulldogge
Bulldog Continental | Continental Bulldog
Bolonka Zwetna | Bolonka
Löwchen | Löwchen | Perro león pequeño
Tibetan Spaniel | Tibetan Spaniel | Spaniel tibetano
King Charles Spaniel | English Toy Spaniel
Gran Boyero Suizo | Greater Swiss Mountain Dog
Entlebucher | Entlebucher Mountain Dog
Lancashire Heeler | Lancashire Heeler
Swedish Lapphund | Swedish Lapphund
Finnish Lapphund | Finnish Lapphund
Spitz Italiano | Volpino Italiano | Volpino
Perro de Canaan | Canaan Dog
Kishu Ken | Kishu Ken
Kai Ken | Kai Ken
Hokkaido | Hokkaido (dog) | Hokkaido Inu
Shikoku | Shikoku (dog)
Jindo Coreano | Korean Jindo | Jindo
Thai Ridgeback | Thai Ridgeback
Ovejero Magallánico | Magellanic Sheepdog
`,

  gato: `
Común Europeo | Domestic short-haired cat | Gato común, Atigrado, Doméstico, Callejero, Tigre, Romano, Europeo, Negro, Blanco, Naranja, Tricolor, Carey, Bicolor
Gato de Pelo Largo | Domestic long-haired cat | Pelo largo, Angorado
Siamés | Siamese cat | Siames, Siamese
Persa | Persian cat | Persian
Persa Chinchilla | Persian cat | Chinchilla
Angora Turco | Turkish Angora | Angora, Angora turca
Van Turco | Turkish Van | Van, Turkish van
Maine Coon
Bengalí | Bengal cat | Bengal
Ragdoll
Birmano | Birman | Sagrado de Birmania, Sacred cat of Burma
Burmés | Burmese cat | Burmese
Burmilla
Bombay | Bombay cat
Azul Ruso | Russian Blue | Ruso azul, Russian blue
British Shorthair | | Británico de pelo corto, Británico, British
British Longhair | British Longhair | Británico de pelo largo
Exótico de Pelo Corto | Exotic Shorthair | Exótico, Exotic
Scottish Fold | | Fold, Scottish
Scottish Straight | Scottish Fold
Sphynx | Sphynx cat | Esfinge, Sphinx, Gato sin pelo
Don Sphynx | Donskoy cat | Donskoy
Peterbald
Devon Rex
Cornish Rex
Selkirk Rex
LaPerm | LaPerm
Abisinio | Abyssinian cat | Abyssinian
Somalí | Somali cat | Somali
Noruego del Bosque | Norwegian Forest cat | Noruego, Skogkatt
Siberiano | Siberian cat | Siberian
Neva Masquerade | Neva Masquerade
Savannah | Savannah cat
Chausie
Ocicat
Egyptian Mau | Egyptian Mau | Mau egipcio
Oriental | Oriental Shorthair | Oriental de pelo corto
Oriental de Pelo Largo | Oriental Longhair
Tonkinés | Tonkinese cat | Tonkinese
Balinés | Balinese cat | Balinese
Javanés | Javanese cat
Himalayo | Himalayan cat | Himalayan, Colourpoint
Snowshoe
Ragamuffin | Ragamuffin cat
Munchkin | Munchkin cat | Gato salchicha
Manx | Manx cat | Gato sin cola
Cymric | Cymric cat
Bobtail Japonés | Japanese Bobtail | Japanese bobtail
Bobtail Americano | American Bobtail
Bobtail de las Kuriles | Kurilian Bobtail | Kurilian
Mekong Bobtail | Mekong Bobtail
Pixie-bob | Pixiebob | Pixie bob
American Shorthair | | Americano de pelo corto
American Wirehair | American Wirehair
American Curl | | Curl americano
Chartreux | | Cartujo
Korat
Singapura
Habana | Havana Brown | Havana Brown, Habana brown
Nebelung
Toyger
Lykoi | Lykoi | Gato lobo
Asiático | Asian cat | Asian
Australian Mist | Australian Mist
Foldex | Exotic Fold
Highlander | Highlander cat
Minuet | Napoleon cat | Napoleon
Sokoke | Sokoke
Serengeti | Serengeti cat
Thai | Thai cat | Gato tailandés, Wichian maat
`,

  conejo: `
Conejo Enano | Netherland Dwarf rabbit | Enano, Netherland dwarf, Conejo toy
Cabeza de León | Lionhead rabbit | Lionhead, Cabeza de leon
Belier | English Lop | Belier enano, Conejo orejas caídas, Lop, Orejón
Mini Lop | Mini Lop | Minilop
Holland Lop | Holland Lop | Holandés
Conejo Angora | Angora rabbit | Angora
Conejo Rex | Rex rabbit | Rex, Mini rex
Mini Rex | Mini Rex
Gigante de Flandes | Flemish Giant rabbit | Flemish giant, Gigante flamenco
Gigante de España | Spanish Giant rabbit
Gigante Alemán | German Giant
Californiano | Californian rabbit | California
Nueva Zelanda | New Zealand rabbit | Neozelandés, New zealand
Mariposa | English Spot | Conejo mariposa
Holandés | Dutch rabbit | Dutch
Hotot | Blanc de Hotot
Satén | Satin | Satin
Havana | Havana rabbit
Plateado de Champaña | Champagne d'Argent | Champagne
Polaco | Polish rabbit | Polish
Pardo Inglés | English Lop | English lop
Jersey Wooly | Jersey Wooly | Jersey wolly
Conejo Belga | Belgian Hare | Liebre belga
Conejo Chinchilla | Chinchilla rabbit
Conejo Azul de Viena | Vienna rabbit
Conejo Silver Fox | Silver Fox rabbit
Conejo Tan | Tan rabbit
Conejo Harlequin | Harlequin rabbit | Arlequín
`,

  ave: `
Canario | Domestic canary | Canary
Canario Roller | Harz Roller
Periquito Australiano | Budgerigar | Periquito, Budgie, Perico
Ninfa | Cockatiel | Cockatiel, Carolina
Agapornis | Lovebird | Agaporni, Inseparable, Inseparables, Lovebird
Cacatúa | Sulphur-crested cockatoo | Cacatua
Loro Amazona | Amazon parrot | Amazona
Loro Hablador | Amazona aestiva | Loro, Loro hablador argentino
Loro Gris Africano | African grey parrot | Yaco, Yaco gris, Loro gris
Guacamayo | Macaw | Guacamayo rojo, Ara
Guacamayo Azul y Amarillo | Blue-and-yellow macaw | Ara ararauna
Cotorra | Monk parakeet | Cotorra argentina, Cotorrita
Eclectus | Eclectus parrot
Cotorra de Collar | Rose-ringed parakeet | Ring neck, Alexandrino
Diamante Mandarín | Zebra finch | Mandarín, Zebra finch, Mandarin
Diamante de Gould | Gouldian finch | Gouldian
Jilguero | Hooded siskin | Jilguero argentino
Cardenal | Red-crested cardinal | Cardenal copete rojo, Cardenal amarillo
Cardenal Amarillo | Yellow cardinal
Reinamora | Ultramarine grosbeak
Chingolo | Rufous-collared sparrow
Zorzal | Rufous-bellied thrush
Calandria | Chalk-browed mockingbird
Paloma | Rock dove | Paloma doméstica, Paloma mensajera
Paloma Mensajera | Racing pigeon
Paloma Colilarga | Fantail pigeon
Tórtola | European turtle dove
Gallina | Chicken | Gallo, Gallina ponedora, Pollo
Gallina Araucana | Araucana | Araucana
Gallina Sedosa | Silkie (chicken)
Gallina Cochinchina | Cochin chicken
Gallina Brahma | Brahma chicken
Gallina Plymouth Rock | Plymouth Rock chicken
Codorniz | Japanese quail | Codorniz japonesa
Pato | Domestic duck | Pato doméstico
Pato Criollo | Muscovy duck | Pato mudo
Ganso | Domestic goose | Ganso doméstico
Pavo | Domesticated turkey | Pavo doméstico
Pavo Real | Indian peafowl | Pavo real, Pavo real indio
Faisán | Common pheasant
Pinzón | Common chaffinch
Gorrión | House sparrow
Cacatúa de Moño Amarillo | Sulphur-crested cockatoo
Cacatúa Alba | White cockatoo
Cacatúa Galah | Galah | Galah, Rosa
Loro Pionus | Pionus
Loro Senegal | Senegal parrot
Loro Cabeciamarillo | Yellow-headed amazon
Loro Barranquero | Burrowing parrot | Loro barranquero
Loro de Frente Azul | Blue-fronted amazon
Lori Arcoíris | Rainbow lorikeet | Lori arcoíris
Hornero | Rufous hornero
`,

  roedor: `
Hámster Sirio | Golden hamster | Hámster dorado, Hamster, Hámster común
Hámster Ruso | Djungarian hamster | Hámster enano ruso, Campbell, Djungarian
Hámster Roborovski | Roborovski hamster | Roborovski
Hámster Chino | Chinese hamster
Hámster Enano | Winter white dwarf hamster | Hámster enano
Cobayo | Guinea pig | Cuy, Cobaya, Conejillo de Indias, Chanchito de la India, Cuis, Guinea pig
Cobayo Abisinio | Abyssinian guinea pig | Cobayo abisinio
Cobayo Peruano | Peruvian guinea pig | Cobayo peruano
Cobayo Inglés | Guinea pig | Cobayo americano, Cobayo de pelo corto
Cobayo Teddy | Teddy guinea pig
Cobayo Skinny | Skinny pig | Skinny pig, Cobayo sin pelo
Cobayo Sheltie | Silkie guinea pig
Cuis | Galea (genus) | Cuis, Cuis común
Chinchilla | Chinchilla | Chinchila
Rata | Brown rat | Rata doméstica, Rata de laboratorio, Rata fancy
Rata Dumbo | Dumbo rat | Dumbo
Ratón | House mouse | Ratón doméstico, Ratón blanco
Jerbo | Mongolian gerbil | Gerbo, Jerbil, Gerbil
Jerbo Mongol | Mongolian gerbil | Gerbil mongol
Ardilla Listada | Eastern chipmunk | Chipmunk, Ardilla rayada, Ardillita
Degú | Common degu | Degus
Carpincho | Capybara
Mara | Patagonian mara | Liebre patagónica
`,

  pez: `
Betta | Siamese fighting fish | Pez luchador, Pez de pelea, Betta splendens, Pez betta
Pez Dorado | Goldfish | Goldfish, Carassius, Pez rojo
Carpa Koi | Koi | Koi, Carpa
Cometa | Goldfish | Pez cometa
Oranda | Oranda | Oranda
Telescopio | Telescope goldfish | Pez telescopio, Ojo de dragón
Guppy | Guppy | Lebistes, Pez millón, Millones
Molly | Poecilia sphenops | Mollie, Molly negro
Platy | Southern platyfish | Platy
Espada | Swordtail | Xipho, Xiphophorus, Pez espada
Neón | Neon tetra | Tetra neón, Neon tetra, Neón tetra
Neón Cardenal | Cardinal tetra | Tetra cardenal
Tetra | Tetra | Tetras
Tetra Limón | Lemon tetra
Tetra Negro | Black tetra
Escalar | Pterophyllum | Pez ángel, Pez angel, Escalare, Angelfish
Pez Disco | Discus (fish) | Disco, Symphysodon
Oscar | Oscar (fish) | Pez oscar, Astronotus
Cíclido | Cichlid | Cichlid, Ciclido
Cíclido Africano | Mbuna | Malawi, Mbuna
Ramirezi | Mikrogeophagus ramirezi | Ramirez, Ramírezi
Corydora | Corydoras | Cory, Corydoras, Limpiafondos, Corydora panda
Pleco | Hypostomus plecostomus | Plecostomus, Limpiavidrios, Pez diablo, Pleco común
Barbo | Barb (fish) | Barbus, Barbo tigre, Barbo cereza
Tiburón Bala | Bala shark | Bala shark, Tiburón de agua dulce
Gurami | Gourami | Gouramis, Gourami perla, Gurami azul
Rasbora | Rasbora | Rasbora arlequín
Danio | Danio | Danio cebra, Pez cebra, Zebrafish
Loche | Botia | Botia, Loche payaso, Botia payaso
Pez Payaso | Ocellaris clownfish | Nemo, Anemone fish
Bagre | Catfish | Bagre
Pez Globo | Pufferfish | Pufferfish, Tetraodon
Ancistrus | Ancistrus | Ancistrus, Pleco ancistrus
Pez Arcoíris | Rainbowfish | Pez arco iris
Pez Cirujano | Surgeonfish | Pez cirujano azul, Dory
Pacú | Pacu
Piraña | Piranha | Piraña roja
`,

  reptil: `
Tortuga Terrestre | Tortoise | Tortuga de tierra, Tortuga
Tortuga Terrestre Argentina | Chelonoidis chilensis | Tortuga argentina, Tortuga de tierra argentina, Chelonoidis chilensis
Tortuga de Orejas Rojas | Red-eared slider | Tortuga de agua, Trachemys scripta, Tortuga acuática, Tortuga de Florida
Tortuga de Agua | Turtle | Tortuga acuática
Tortuga Pintada | Painted turtle
Tortuga Mediterránea | Greek tortoise | Testudo graeca, Testudo hermanni
Tortuga de Caja | Box turtle
Tortuga Rusa | Russian tortoise | Tortuga de Horsfield
Tortuga Sulcata | African spurred tortoise | Sulcata
Tortuga Leopardo | Leopard tortoise
Tortuga Morrocoy | Red-footed tortoise | Morrocoy, Chelonoidis carbonarius, Jabuti
Iguana Verde | Green iguana | Iguana
Gecko Leopardo | Leopard gecko | Leopard gecko, Geco leopardo, Gecko
Gecko Crestado | Crested gecko | Crested gecko, Geco crestado
Gecko Diurno | Day gecko | Gecko día
Gecko Tokay | Tokay gecko
Dragón Barbudo | Central bearded dragon | Pogona, Barbudo, Dragon barbudo
Camaleón | Chameleon | Camaleón común
Camaleón Velado | Veiled chameleon
Camaleón Pantera | Panther chameleon
Pitón Bola | Ball python | Pitón real, Python regius
Pitón Reticulada | Reticulated python
Pitón Birmana | Burmese python
Boa Constrictor | Boa constrictor | Boa
Boa Arco Iris | Rainbow boa
Boa de Arena | Sand boa
Serpiente del Maíz | Corn snake | Corn snake, Culebra del maíz
Culebra Real | Kingsnake | Serpiente rey, Kingsnake
Serpiente Leche | Milk snake | Milk snake
Serpiente Liga | Garter snake | Garter snake
Serpiente Gopher | Gopher snake
Serpiente Hocico de Cerdo | Hognose snake | Hognose
Culebra de Escalera | Ladder snake
Teyú | Argentine black and white tegu | Lagarto overo, Overo, Tegu, Teju, Tegu argentino
Lagarto Colorado | Argentine red tegu | Tegu colorado
Lagarto Monitor | Monitor lizard | Varano
Varano de Sabana | Savannah monitor | Savannah monitor
Eslizón | Skink | Skink, Lagartija
Lagartija | Lizard | Lagartija común
Eslizón de Lengua Azul | Blue-tongued skink | Blue tongue skink
Anolis | Anolis | Anolis verde
Basilisco | Basilisk
Ajolote | Axolotl | Axolotl
Rana | Frog | Rana de cuerno, Rana arbórea
Sapo | Toad | Sapo común
Rana Pacman | Ceratophrys | Pacman, Rana de Pacman, Ceratophrys
Tritón | Newt
`,

  otro: `
Hurón | Ferret | Ferret
Erizo de Tierra | Hedgehog | Erizo, Erizo pigmeo africano, Erizo africano
Cerdo Vietnamita | Vietnamese pot-bellied pig | Cerdo enano, Mini pig, Cerdito, Mini cerdo
Cabra | Goat | Cabra enana, Cabrita
Cabra Enana | Pygmy goat | Cabra pigmea
Oveja | Sheep | Cordero, Ovejita
Caballo | Horse | Equino
Poni | Pony | Pony, Poni enano
Burro | Donkey | Asno
Mula | Mule
Llama | Llama
Alpaca | Alpaca
Vaca | Cattle | Vacuno, Ternero
Tarántula | Tarantula | Araña, Araña pollito
Insecto Palo | Stick insect | Insecto hoja, Phasmida
Mantis | Mantis | Mantis religiosa
Petauro del Azúcar | Sugar glider | Petauro, Sugar glider
Pintada | Helmeted guineafowl
`,
};

function normalizeName(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugify(text) {
  return normalizeName(text).replace(/\s+/g, '-');
}

function parse() {
  const out = [];
  for (const [speciesSlug, block] of Object.entries(RAW)) {
    const seen = new Set();
    // El primer elemento de cada especie es siempre la opción genérica.
    out.push({
      speciesSlug,
      name: GENERIC_NAME,
      slug: slugify(GENERIC_NAME),
      aliases: GENERIC_ALIASES,
      wikiTitle: null,
      isGeneric: true,
    });
    seen.add(slugify(GENERIC_NAME));

    for (const line of block.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const [rawName, rawWiki, rawAliases] = trimmed.split('|').map((s) => s.trim());
      const slug = slugify(rawName);
      if (seen.has(slug)) continue;
      seen.add(slug);
      out.push({
        speciesSlug,
        name: rawName,
        slug,
        aliases: rawAliases || '',
        wikiTitle: rawWiki || rawName,
        isGeneric: false,
      });
    }
  }
  return out;
}

module.exports = { BREEDS: parse(), GENERIC_NAME, normalizeName, slugify };
