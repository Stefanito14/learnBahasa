(function (root, factory) {
  "use strict";
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = mod;
  else root.BAHASA_DATA = mod;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var vocab = [
  {theme:"Salutations & politesse", items:[
    {fr:"bonjour (matin)",id:"selamat pagi"},{fr:"bonjour (midi)",id:"selamat siang"},
    {fr:"bonsoir / bonne nuit",id:"selamat malam"},{fr:"au revoir (à qui part)",id:"selamat jalan"},
    {fr:"au revoir (à qui reste)",id:"selamat tinggal"},{fr:"à bientôt",id:"sampai jumpa"},
    {fr:"merci",id:"terima kasih"},{fr:"de rien",id:"sama-sama"},{fr:"s'il te plaît (demande)",id:"tolong"},
    {fr:"je t'en prie / vas-y",id:"silakan"},{fr:"pardon / désolé",id:"maaf"},{fr:"excusez-moi (passer)",id:"permisi"},
    {fr:"oui",id:"ya"},{fr:"non / ne pas",id:"tidak"},{fr:"comment ça va ?",id:"apa kabar?"},
    {fr:"ça va bien",id:"kabar baik"},{fr:"monsieur",id:"Pak"},{fr:"madame",id:"Bu"}
  ]},
  {theme:"Personnes & famille", items:[
    {fr:"je / moi",id:"saya"},{fr:"je (familier)",id:"aku"},{fr:"tu / toi",id:"kamu"},
    {fr:"vous (poli)",id:"Anda"},{fr:"il / elle",id:"dia"},{fr:"nous (avec toi)",id:"kita"},
    {fr:"nous (sans toi)",id:"kami"},{fr:"ils / elles",id:"mereka"},{fr:"ami",id:"teman"},
    {fr:"famille",id:"keluarga"},{fr:"mère",id:"ibu"},{fr:"père",id:"ayah"},{fr:"enfant",id:"anak"},
    {fr:"homme",id:"laki-laki"},{fr:"femme",id:"perempuan"},{fr:"nom",id:"nama"}
  ]},
  {theme:"Nombres", items:[
    {fr:"zéro",id:"nol"},{fr:"un",id:"satu"},{fr:"deux",id:"dua"},{fr:"trois",id:"tiga"},
    {fr:"quatre",id:"empat"},{fr:"cinq",id:"lima"},{fr:"six",id:"enam"},{fr:"sept",id:"tujuh"},
    {fr:"huit",id:"delapan"},{fr:"neuf",id:"sembilan"},{fr:"dix",id:"sepuluh"},{fr:"onze",id:"sebelas"},
    {fr:"vingt",id:"dua puluh"},{fr:"cent",id:"seratus"},{fr:"mille",id:"seribu"},
    {fr:"dix mille",id:"sepuluh ribu"},{fr:"cent mille",id:"seratus ribu"},{fr:"un million",id:"satu juta"}
  ]},
  {theme:"Temps", items:[
    {fr:"aujourd'hui",id:"hari ini"},{fr:"demain",id:"besok"},{fr:"hier",id:"kemarin"},
    {fr:"maintenant",id:"sekarang"},{fr:"plus tard",id:"nanti"},{fr:"jour",id:"hari"},
    {fr:"semaine",id:"minggu"},{fr:"mois",id:"bulan"},{fr:"année",id:"tahun"},{fr:"heure",id:"jam"},
    {fr:"matin",id:"pagi"},{fr:"après-midi",id:"sore"},{fr:"nuit",id:"malam"},{fr:"lundi",id:"Senin"},
    {fr:"samedi",id:"Sabtu"},{fr:"dimanche",id:"Minggu"}
  ]},
  {theme:"Nourriture & boisson", items:[
    {fr:"manger",id:"makan"},{fr:"boire",id:"minum"},{fr:"eau",id:"air"},{fr:"riz",id:"nasi"},
    {fr:"poulet",id:"ayam"},{fr:"poisson",id:"ikan"},{fr:"légume",id:"sayur"},{fr:"fruit",id:"buah"},
    {fr:"café",id:"kopi"},{fr:"thé",id:"teh"},{fr:"bière",id:"bir"},{fr:"délicieux",id:"enak"},
    {fr:"épicé / piquant",id:"pedas"},{fr:"sucré",id:"manis"},{fr:"l'addition",id:"bon / nota"},
    {fr:"petit resto local",id:"warung"},{fr:"petit-déjeuner",id:"sarapan"},{fr:"sans piment",id:"tidak pedas"}
  ]},
  {theme:"Transport & directions", items:[
    {fr:"où ?",id:"di mana?"},{fr:"gauche",id:"kiri"},{fr:"droite",id:"kanan"},{fr:"tout droit",id:"lurus"},
    {fr:"ici",id:"di sini"},{fr:"là-bas",id:"di sana"},{fr:"loin",id:"jauh"},{fr:"près",id:"dekat"},
    {fr:"aéroport",id:"bandara"},{fr:"gare",id:"stasiun"},{fr:"bus",id:"bus"},{fr:"train",id:"kereta"},
    {fr:"taxi",id:"taksi"},{fr:"moto",id:"motor"},{fr:"aller",id:"pergi"},{fr:"s'arrêter",id:"berhenti"},
    {fr:"billet",id:"tiket"}
  ]},
  {theme:"Hébergement", items:[
    {fr:"hôtel",id:"hotel"},{fr:"chambre",id:"kamar"},{fr:"clé",id:"kunci"},{fr:"lit",id:"tempat tidur"},
    {fr:"salle de bain",id:"kamar mandi"},{fr:"climatisation",id:"AC"},{fr:"serviette",id:"handuk"},
    {fr:"réserver",id:"pesan"},{fr:"propre",id:"bersih"},{fr:"sale",id:"kotor"}
  ]},
  {theme:"Argent & marché", items:[
    {fr:"argent",id:"uang"},{fr:"prix",id:"harga"},{fr:"cher",id:"mahal"},{fr:"bon marché",id:"murah"},
    {fr:"combien ?",id:"berapa?"},{fr:"acheter",id:"beli"},{fr:"payer",id:"bayar"},{fr:"marché",id:"pasar"},
    {fr:"magasin",id:"toko"},{fr:"carte bancaire",id:"kartu"},{fr:"on peut baisser ?",id:"boleh kurang?"},
    {fr:"trop cher",id:"terlalu mahal"}
  ]},
  {theme:"Verbes essentiels", items:[
    {fr:"vouloir",id:"mau"},{fr:"pouvoir (capable)",id:"bisa"},{fr:"pouvoir (permission)",id:"boleh"},
    {fr:"avoir",id:"punya"},{fr:"il y a",id:"ada"},{fr:"savoir",id:"tahu"},{fr:"comprendre",id:"mengerti"},
    {fr:"aimer",id:"suka"},{fr:"aider",id:"bantu"},{fr:"chercher",id:"cari"},{fr:"donner",id:"kasih"},
    {fr:"prendre",id:"ambil"},{fr:"attendre",id:"tunggu"},{fr:"voir / regarder",id:"lihat"},
    {fr:"parler",id:"bicara"},{fr:"dormir",id:"tidur"},{fr:"venir",id:"datang"}
  ]},
  {theme:"Adjectifs utiles", items:[
    {fr:"grand",id:"besar"},{fr:"petit",id:"kecil"},{fr:"bon (qualité)",id:"bagus"},{fr:"gentil",id:"baik"},
    {fr:"mauvais / moche",id:"jelek"},{fr:"chaud",id:"panas"},{fr:"froid",id:"dingin"},{fr:"nouveau",id:"baru"},
    {fr:"vieux (âge)",id:"tua"},{fr:"ancien (durée)",id:"lama"},{fr:"content",id:"senang"},
    {fr:"fatigué",id:"capek"},{fr:"beau (homme)",id:"ganteng"},{fr:"joli (femme)",id:"cantik"}
  ]},
  {theme:"Urgence & santé", items:[
    {fr:"à l'aide !",id:"tolong!"},{fr:"médecin",id:"dokter"},{fr:"hôpital",id:"rumah sakit"},
    {fr:"pharmacie",id:"apotek"},{fr:"police",id:"polisi"},{fr:"malade",id:"sakit"},
    {fr:"mal de tête",id:"sakit kepala"},{fr:"mal au ventre",id:"sakit perut"},{fr:"allergie",id:"alergi"},
    {fr:"j'ai besoin de…",id:"saya butuh"},{fr:"je ne comprends pas",id:"saya tidak mengerti"}
  ]},
  {theme:"Petits mots & connecteurs", items:[
    {fr:"et",id:"dan"},{fr:"ou",id:"atau"},{fr:"mais",id:"tapi"},{fr:"parce que",id:"karena"},
    {fr:"donc",id:"jadi"},{fr:"si",id:"kalau"},{fr:"avec",id:"dengan"},{fr:"pour",id:"untuk"},
    {fr:"aussi",id:"juga"},{fr:"très",id:"sangat"},{fr:"déjà",id:"sudah"},{fr:"pas encore",id:"belum"},
    {fr:"encore",id:"masih"},{fr:"un peu",id:"sedikit"},{fr:"beaucoup",id:"banyak"}
  ]}
];

  var phrases = [
    {g:"L'essentiel",rows:[["Bonjour (journée)","Selamat siang"],["Merci (beaucoup)","Terima kasih (banyak)"],["Oui / Non","Ya / Tidak"],["Pardon, excusez-moi","Maaf / Permisi"],["Je ne comprends pas","Saya tidak mengerti"],["Parlez-vous anglais ?","Bisa bahasa Inggris?"],["Comment dit-on… ?","Bagaimana bilang…?"]]},
    {g:"Se débrouiller",rows:[["Où sont les toilettes ?","Di mana toilet?"],["Combien ça coûte ?","Berapa harganya?"],["C'est trop cher","Terlalu mahal"],["On peut baisser ?","Boleh kurang?"],["Je voudrais ceci","Saya mau ini"],["L'addition svp","Minta bon"],["Sans piment","Tidak pedas"]]},
    {g:"Urgence",rows:[["À l'aide !","Tolong!"],["J'ai besoin d'un médecin","Saya butuh dokter"],["Appelez la police","Panggil polisi"],["Je suis malade","Saya sakit"],["Où est l'hôpital ?","Di mana rumah sakit?"]]},
    {g:"Sympathiser",rows:[["Comment ça va ?","Apa kabar?"],["Ça va bien","Kabar baik"],["Je m'appelle…","Nama saya…"],["Enchanté","Senang bertemu"],["D'où venez-vous ?","Dari mana?"],["Je viens de France","Saya dari Prancis"]]}
  ];

  var dialogues = [
    {t:"🛺 Prendre un taxi / Grab",lines:[["Vous","Pak, ke Malioboro berapa?","Monsieur, combien pour Malioboro ?"],["Chauffeur","Lima puluh ribu.","50 000 roupies."],["Vous","Mahal! Empat puluh ribu, boleh?","Cher ! 40 000, possible ?"],["Chauffeur","Oke, naik.","Ok, montez."]]},
    {t:"🍜 Commander au warung",lines:[["Vous","Mbak, ada nasi goreng?","Mademoiselle, il y a du nasi goreng ?"],["Serveuse","Ada. Pedas atau tidak?","Oui. Épicé ou pas ?"],["Vous","Tidak pedas, ya. Sama es teh.","Pas épicé. Avec un thé glacé."],["Serveuse","Baik, tunggu sebentar.","Bien, un instant."]]},
    {t:"🏨 À l'hôtel",lines:[["Vous","Ada kamar kosong malam ini?","Une chambre libre ce soir ?"],["Réception","Ada. Berapa malam?","Oui. Combien de nuits ?"],["Vous","Dua malam. Ada AC dan wifi?","Deux nuits. Il y a clim et wifi ?"],["Réception","Ada semua.","Tout y est."]]},
    {t:"🛍️ Marchander au marché",lines:[["Vous","Ini berapa, Bu?","C'est combien, madame ?"],["Vendeuse","Seratus ribu.","100 000."],["Vous","Wah, mahal. Boleh kurang? Tujuh puluh?","Oh, cher. On baisse ? 70 ?"],["Vendeuse","Delapan puluh, deh.","Allez, 80."],["Vous","Oke, saya beli.","Ok, j'achète."]]}
  ];

  var drills = [
    {frame:"Saya mau ___.",tr:"Je veux ___.",chips:[["kopi","un café"],["nasi goreng","du riz frit"],["air putih","de l'eau"],["teh manis","un thé sucré"]]},
    {frame:"Di mana ___?",tr:"Où est ___ ?",chips:[["toilet","les toilettes"],["hotel","l'hôtel"],["stasiun","la gare"],["pasar","le marché"]]},
    {frame:"Ini ___.",tr:"C'est ___.",chips:[["enak","délicieux"],["mahal","cher"],["bagus","bien"],["murah","bon marché"]]},
    {frame:"Saya tidak ___.",tr:"Je ne ___ pas.",chips:[["mengerti","comprends"],["suka","aime"],["tahu","sais"],["mau","veux"]]},
    {frame:"Saya sudah ___.",tr:"J'ai déjà ___.",chips:[["makan","mangé"],["bayar","payé"],["pesan","réservé"],["sampai","suis arrivé"]]}
  ];

  var food = [["nasi goreng","riz frit"],["mie goreng","nouilles sautées"],["sate","brochettes"],
    ["rendang","bœuf mijoté épicé"],["gado-gado","salade & sauce cacahuète"],["soto","soupe"],["bakso","boulettes"],
    ["tempe","soja fermenté"],["sambal","sauce piment"],["kecap manis","soja sucré"],["nasi padang","riz & plats variés"]];

  var lessons = [
    { id: "p1-l1", phase: 1, title: "Les sons de la langue",
      goal: "Lire l'indonésien à voix haute sans bloquer.",
      steps: [
        { text: "Lis les voyelles et consonnes, et clique 🔊 pour écouter chaque exemple.", target: { tab: "prononciation" } },
        { text: "Répète 4 phrases en imitant le rythme (shadowing).", target: { tab: "prononciation", anchor: "shadowing" } }
      ] },
    { id: "p1-l2", phase: 1, title: "Bonjour & merci",
      goal: "Saluer poliment et remercier dans toutes les situations.",
      steps: [
        { text: "Apprends les cartes du thème « Salutations & politesse ».", target: { tab: "vocab", theme: "Salutations & politesse" } },
        { text: "Lis les phrases de « L'essentiel » à voix haute.", target: { tab: "phrases" } },
        { text: "Teste-toi : 5 questions du quiz de vocabulaire.", target: { tab: "training", anchor: "quiz-voc" } }
      ] },
    { id: "p1-l3", phase: 1, title: "Te présenter",
      goal: "Dire ton nom, d'où tu viens et ce que tu fais.",
      steps: [
        { text: "Apprends le thème « Personnes & famille ».", target: { tab: "vocab", theme: "Personnes & famille" } },
        { text: "Lis « L'ossature de la phrase » (ordre des mots, pas de verbe être).", target: { tab: "grammaire" } },
        { text: "Repère les phrases « Sympathiser » (Je m'appelle…, D'où venez-vous ?).", target: { tab: "phrases" } },
        { text: "Tire le sujet « Présente-toi » et dis-le à voix haute.", target: { tab: "carnet" } }
      ] },
    { id: "p1-l4", phase: 1, title: "Compter & les prix",
      goal: "Dire et comprendre les nombres et un prix.",
      steps: [
        { text: "Apprends le thème « Nombres ».", target: { tab: "vocab", theme: "Nombres" } },
        { text: "Entraîne-toi avec le quiz des nombres.", target: { tab: "training", anchor: "quiz-num" } },
        { text: "Apprends le thème « Argent & marché ».", target: { tab: "vocab", theme: "Argent & marché" } },
        { text: "Repère les phrases « Se débrouiller » (Berapa harganya ?).", target: { tab: "phrases" } }
      ] },
    { id: "p1-l5", phase: 1, title: "Commander à manger",
      goal: "Commander simplement, sans piment.",
      steps: [
        { text: "Apprends le thème « Nourriture & boisson ».", target: { tab: "vocab", theme: "Nourriture & boisson" } },
        { text: "Fais le drill « Saya mau ___ ».", target: { tab: "training", anchor: "drill-mount" } },
        { text: "Joue le dialogue « Commander au warung » à voix haute.", target: { tab: "phrases", anchor: "dialogues-mount" } }
      ] },
    { id: "p1-l6", phase: 1, title: "Dire non & poser des questions",
      goal: "Nier correctement et poser 5 questions de base.",
      steps: [
        { text: "Lis « Dire non » (tidak vs bukan).", target: { tab: "grammaire" } },
        { text: "Lis « Poser des questions » (apa, siapa, di mana…).", target: { tab: "grammaire" } },
        { text: "Fais le drill « Di mana ___ ? ».", target: { tab: "training", anchor: "drill-mount" } }
      ] },
    { id: "p1-l7", phase: 1, title: "Présent, passé, futur",
      goal: "Situer une action dans le temps avec sudah / sedang / akan.",
      steps: [
        { text: "Lis « Le temps sans conjugaison ».", target: { tab: "grammaire" } },
        { text: "Apprends le thème « Temps ».", target: { tab: "vocab", theme: "Temps" } },
        { text: "Fais le drill « Saya sudah ___ ».", target: { tab: "training", anchor: "drill-mount" } },
        { text: "Tire le sujet « Raconte ta journée d'hier » et raconte-la.", target: { tab: "carnet" } }
      ] }
  ];

  return { vocab: vocab, phrases: phrases, dialogues: dialogues, drills: drills, food: food, lessons: lessons };
});
