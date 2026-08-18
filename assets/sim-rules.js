// Moteur de règles — subsides communaux de Binche (source : regles.json v1.1, CC 12/10/2009 et modifications 2016/2019)
(function(){
function eur(n){return n.toLocaleString('fr-BE',{minimumFractionDigits:0,maximumFractionDigits:2})+' \u20ac';}
var CG={
 avertissement:"Simulation indicative. Seule la d\u00e9cision du Conseil communal fait foi. L'octroi reste subordonn\u00e9 \u00e0 la disponibilit\u00e9 des cr\u00e9dits budg\u00e9taires (art. 3 du r\u00e8glement g\u00e9n\u00e9ral) ; en cas d'insuffisance de cr\u00e9dit, les montants sont r\u00e9partis proportionnellement entre b\u00e9n\u00e9ficiaires.",
 eligibilite:[
  {t:"\u00catre agr\u00e9\u00e9e par le Conseil communal (demande \u00e9crite \u00e0 la Ville, formulaire de candidature)",a:"art. 1\u20132"},
  {t:"Mener des activit\u00e9s \u00e0 caract\u00e8re d'int\u00e9r\u00eat g\u00e9n\u00e9ral, originales et en ad\u00e9quation avec la politique g\u00e9n\u00e9rale de la ville",a:"art. 3"},
  {t:"Avoir son si\u00e8ge social ou local dans l'entit\u00e9, ou contribuer \u00e0 l'int\u00e9r\u00eat g\u00e9n\u00e9ral local et au d\u00e9veloppement de la population binchoise",a:"art. 3"},
  {t:"Activit\u00e9s ouvertes \u00e0 tous, sans discrimination et dans le respect des valeurs d\u00e9mocratiques",a:"art. 3"},
  {t:"Compter au moins un an d'existence et d'activit\u00e9 effective",a:"art. 3"},
  {t:"Poss\u00e9der un compte bancaire propre",a:"art. 3"}],
 obligations:[
  {t:"Introduire chaque ann\u00e9e sa demande via le formulaire officiel (3 exemplaires), avec annexe des activit\u00e9s pass\u00e9es et du programme \u00e0 venir",a:"art. 7\u20138"},
  {t:"Rentrer le formulaire dans les 30 jours de son envoi, sous peine de perdre la qualit\u00e9 d'association reconnue",a:"art. 18"},
  {t:"Justifier l'utilisation du subside dans les 90 jours du versement (31 mars de l'ann\u00e9e suivante pour les ASBL)",a:"art. 15\u201316"},
  {t:"Faire figurer \u00ab AVEC LE SOUTIEN DE LA VILLE DE BINCHE \u00bb sur les documents promotionnels",a:"art. 14"},
  {t:"Utiliser le subside aux fins pr\u00e9vues ; restitution en cas d'usage non conforme ou de d\u00e9faut de justification",a:"art. 13, 20"}]
};
function L(label,article,amount,opt){var o=opt||{};return{label:label,article:article||'',amount:amount,amountText:amount==null?(o.amountText||'\u2014'):eur(amount),cond:!!o.cond,note:o.note||''};}
function num(v){v=Number(v);return isNaN(v)?0:v;}
var CATS=[
{id:'culturelles',label:'Associations culturelles locales',icon:'\ud83c\udfad',ref:'CC 12/10/2009 pt 24',teaser:'jusqu\u2019\u00e0 4.500 \u20ac/an',pour:"Vous promouvez les arts, la connaissance ou les travaux de l'esprit (th\u00e9\u00e2tre, danse, arts plastiques, patrimoine\u2026).",
 questions:[
  {id:'proprietaire',type:'bool',label:"L'association est-elle propri\u00e9taire de ses installations et en assure-t-elle le fonctionnement et l'entretien de ses deniers ?"},
  {id:'personnalite_juridique',type:'bool',label:"L'association dispose-t-elle de la personnalit\u00e9 juridique (ASBL) ?",visible:function(a){return a.proprietaire!==true;}}],
 compute:function(a){var lines=[],notes=[];
  if(a.proprietaire===true){lines.push(L('Association propri\u00e9taire de ses installations','art. 7',4500));}
  else if(a.personnalite_juridique===true){lines.push(L('Activit\u00e9s permanentes, avec personnalit\u00e9 juridique','art. 6',400));}
  else{lines.push(L('Activit\u00e9s permanentes, sans personnalit\u00e9 juridique','art. 5',200));}
  notes.push("Les montants de 200 \u20ac et 400 \u20ac visent les associations ayant des activit\u00e9s permanentes (art. 5\u20136).");
  notes.push("Un subside ponctuel et exceptionnel reste possible : max. 50 % du budget de la manifestation, plafonn\u00e9 \u00e0 1.600 \u20ac, non cumulable sur un m\u00eame exercice (art. 8\u20139).");
  return{lines:lines,notes:notes};}},
{id:'sportives',label:'Associations sportives locales',icon:'\u26bd',ref:'CC 12/10/2009 pt 25',teaser:'jusqu\u2019\u00e0 2.300 \u20ac/an',pour:"Votre club est affili\u00e9 \u00e0 une f\u00e9d\u00e9ration ou un mouvement officiels.",
 questions:[
  {id:'nb_membres',type:'number',label:'Nombre de membres'},
  {id:'nb_equipes_championnat',type:'number',label:"Nombre d'\u00e9quipes participant \u00e0 un championnat"},
  {id:'act_adultes_regional',type:'number',max:2,label:'Activit\u00e9s hors championnat pour adultes, \u00e0 caract\u00e8re r\u00e9gional',hint:'max. 2 prises en compte'},
  {id:'act_adultes_national',type:'number',max:1,label:'Activit\u00e9s hors championnat pour adultes, \u00e0 caract\u00e8re national ou international',hint:'max. 1 prise en compte'},
  {id:'act_jeunesse_regional',type:'number',max:2,label:'Activit\u00e9s de promotion sportive de la jeunesse, \u00e0 caract\u00e8re r\u00e9gional',hint:'max. 2 prises en compte'},
  {id:'act_jeunesse_national',type:'number',max:1,label:'Activit\u00e9s de promotion sportive de la jeunesse, \u00e0 caract\u00e8re national ou international',hint:'max. 1 prise en compte'},
  {id:'discipline',type:'enum',label:'Discipline principale',options:[['basket','Basket'],['football_urbsfa','Football URBSFA'],['football_amateur','Football amateur'],['football_corporatif','Football corporatif'],['mini_foot','Mini-foot'],['marche','Marche'],['tennis_de_table','Tennis de table'],['autre','Autre discipline']]},
  {id:'infra_privee_sans_aide',type:'bool',label:'Le club utilise-t-il des infrastructures priv\u00e9es sans participation de la Ville dans les frais de location ?',visible:function(a){return a.discipline==='football_urbsfa'||a.discipline==='tennis_de_table';}}],
 compute:function(a){var lines=[],notes=[];var m=num(a.nb_membres);
  if(m>=1&&m<=200)lines.push(L('Subside de base (1 \u00e0 200 membres)','art. 5.1',65));
  else if(m>200)lines.push(L('Subside de base (plus de 200 membres)','art. 5.1',50,{note:'Bar\u00e8me d\u00e9croissant tel quel dans le r\u00e8glement de 2009'}));
  var ar=Math.min(num(a.act_adultes_regional),2),an=Math.min(num(a.act_adultes_national),1),jr=Math.min(num(a.act_jeunesse_regional),2),jn=Math.min(num(a.act_jeunesse_national),1);
  if(ar)lines.push(L(ar+' activit\u00e9(s) adultes r\u00e9gionale(s) \u00d7 65 \u20ac','art. 5.2',ar*65));
  if(an)lines.push(L(an+' activit\u00e9 adultes nationale/internationale \u00d7 130 \u20ac','art. 5.2',an*130));
  if(jr)lines.push(L(jr+' activit\u00e9(s) jeunesse r\u00e9gionale(s) \u00d7 100 \u20ac','art. 5.2',jr*100));
  if(jn)lines.push(L(jn+' activit\u00e9 jeunesse nationale/internationale \u00d7 165 \u20ac','art. 5.2',jn*165));
  var eq=num(a.nb_equipes_championnat);
  if(eq>=1)lines.push(L(eq+' \u00e9quipe(s) en championnat : 75 \u20ac + '+(eq-1)+' \u00d7 50 \u20ac','art. 5.3',75+(eq-1)*50));
  var d=a.discipline;
  if(d==='basket')lines.push(L('Suppl\u00e9ment basket','art. 6.1',250));
  if(d==='football_amateur')lines.push(L('Suppl\u00e9ment football amateur','art. 6.2',150));
  if(d==='football_corporatif')lines.push(L('Suppl\u00e9ment football corporatif','art. 6.3',75));
  if(d==='football_urbsfa'){
   if(a.infra_privee_sans_aide===true)lines.push(L('Club URBSFA en infrastructures priv\u00e9es sans participation communale','art. 6.4.b',1100));
   else lines.push(L('Suppl\u00e9ment club URBSFA','art. 6.4.a',500));
   lines.push(L("Subside exceptionnel URBSFA \u2014 uniquement l'ann\u00e9e o\u00f9 votre club est d\u00e9sign\u00e9 dans le cycle (Ressaix, RUSC Binche, P\u00e9ronnes, Bray, Buvrinnes, Leval)",'art. 6.4.c',null,{cond:true,amountText:'1.500 \u20ac si d\u00e9sign\u00e9'}));}
  if(d==='tennis_de_table'&&a.infra_privee_sans_aide===true)lines.push(L('Club de tennis de table sans aide de la Ville pour la location','art. 6.7',300));
  if(d==='mini_foot')lines.push(L("Club organisateur du tournoi de l'entit\u00e9 de l'ann\u00e9e",'art. 6.5',null,{cond:true,amountText:'125 \u20ac si organisateur'}));
  if(d==='marche')lines.push(L('Montants nominatifs marche (Marche Saint-\u00c9tienne 125 \u20ac, Marcheurs de la Police 250 \u20ac, Tatanes Ail\u00e9es 250 \u20ac, GP Robert Schoukens 400 \u20ac, Corrida des Remparts 400 \u20ac)','art. 6.6',null,{cond:true,amountText:'selon b\u00e9n\u00e9ficiaire'}));
  if(d==='autre')notes.push("Discipline non list\u00e9e : le Conseil communal peut fixer un subside sur proposition du Coll\u00e8ge (art. 6.8).");
  notes.push("Tout club acc\u00e9dant \u00e0 l'\u00e9lite de sa discipline peut recevoir un subside exceptionnel l'ann\u00e9e de son accession (montant fix\u00e9 par le Conseil).");
  notes.push("Subside ponctuel possible : max. 50 % du budget, plafonn\u00e9 \u00e0 2.400 \u20ac (art. 7).");
  return{lines:lines,notes:notes};}},
{id:'jeunesse',label:'Organisations de jeunesse',icon:'\u26fa',ref:'CC 12/10/2009 pt 23',teaser:'jusqu\u2019\u00e0 500 \u20ac par camp',pour:'Vous animez un mouvement de jeunesse (scouts, patro\u2026) ou organisez des camps.',
 questions:[
  {id:'activites_regulieres',type:'bool',label:"Le mouvement organise-t-il r\u00e9guli\u00e8rement des activit\u00e9s pour les enfants et adolescents de l'entit\u00e9 ?"},
  {id:'camps',type:'liste',label:'Camps de vacances organis\u00e9s cette ann\u00e9e',fields:[{id:'duree_jours',label:'Dur\u00e9e (jours)'},{id:'participants_6_18',label:'Participants 6\u201318 ans (hors encadrement)'}]}],
 compute:function(a){var lines=[],notes=[];
  if(a.activites_regulieres===true)lines.push(L('Subside de base \u2014 activit\u00e9s r\u00e9guli\u00e8res','art. 3',186));
  (a.camps||[]).forEach(function(c,i){var d=num(c.duree_jours),p=num(c.participants_6_18);var n='Camp '+(i+1)+' ('+d+' j, '+p+' part.)';
   if(d<10)lines.push(L(n+' \u2014 moins de 10 jours : non subsidiable','art. 4',0));
   else if(p>=15&&p<=25)lines.push(L(n+' \u2014 15 \u00e0 25 participants','art. 6',250));
   else if(p>=26&&p<=50)lines.push(L(n+' \u2014 26 \u00e0 50 participants','art. 6',375));
   else if(p>=51)lines.push(L(n+' \u2014 plus de 50 participants','art. 6',500));
   else lines.push(L(n+' \u2014 moins de 15 participants : aucun subside camp pr\u00e9vu par le bar\u00e8me','art. 6',0));});
  notes.push('Justificatifs camps : contrats de location + d\u00e9claration sur l\u2019honneur du nombre de participants (art. 5).');
  return{lines:lines,notes:notes};}},
{id:'carnavalesques',label:'Soci\u00e9t\u00e9s carnavalesques',icon:'\ud83c\udfad',ref:'CC 12/10/2009 pt 34, mod. CC 19/02/2019',teaser:'jusqu\u2019\u00e0 3.000 \u20ac/an',pour:'Soci\u00e9t\u00e9s de gilles, de fantaisie, Paysans, Pierrots\u2026 du carnaval.',
 questions:[
  {id:'zone',type:'enum',label:'La soci\u00e9t\u00e9 sort-elle \u00e0 Binche-centre ou dans l\u2019entit\u00e9 ?',options:[['binche','Binche-centre'],['entite','Entit\u00e9 (villages)']]},
  {id:'type_societe',type:'enum',label:'Type de soci\u00e9t\u00e9',visible:function(a){return a.zone==='binche';},options:[['gilles_ou_fantaisie','Soci\u00e9t\u00e9 de gilles ou de fantaisie'],['fantaisie_jeunesse','Fantaisie \u00ab jeunesse \u00bb (Paysans, Pierrots, Arlequins)'],['petits_gilles','Petits Gilles'],['jeune_garde_ou_jeunesse_trad','Jeune Garde lib\u00e9rale / Royale Jeunesse catholique / Jeunesse socialiste'],['adf','Association de D\u00e9fense du Folklore'],['lundi_gras','Association du Lundi-Gras'],['trouilles_de_nouilles','Trouilles de Nouilles']]},
  {id:'type_societe_e',type:'enum',label:'Type de soci\u00e9t\u00e9',visible:function(a){return a.zone==='entite';},options:[['gilles','Soci\u00e9t\u00e9 de gilles'],['fantaisie','Soci\u00e9t\u00e9 de fantaisie'],['groupe_costume_precarnavalesque','Groupe costum\u00e9 pr\u00e9carnavalesque (batterie, musique ou viole)']]},
  {id:'sous_type_jeunesse',type:'enum',label:'Paysans, Pierrots ou Arlequins ?',visible:function(a){return a.zone==='binche'&&a.type_societe==='fantaisie_jeunesse';},options:[['paysans','Paysans'],['pierrots','Pierrots'],['arlequins','Arlequins']]},
  {id:'sortie_mardi_gras_matin',type:'bool',label:'Sortie le mardi gras au matin (Paysans en musique / Pierrots \u00e0 la viole) ?',visible:function(a){return a.sous_type_jeunesse==='paysans'||a.sous_type_jeunesse==='pierrots';}},
  {id:'jours_sortie_precarnaval',type:'number',label:'Nombre de jours de sortie en p\u00e9riode pr\u00e9carnavalesque',visible:function(a){return a.zone==='entite'&&a.type_societe_e==='groupe_costume_precarnavalesque';}}],
 compute:function(a){var lines=[],notes=[];var A='art. 1er, mod. CC 19/02/2019';
  if(a.zone==='binche'){var t=a.type_societe;
   if(t==='gilles_ou_fantaisie')lines.push(L('Soci\u00e9t\u00e9 de gilles ou de fantaisie (Binche)',A,1250));
   if(t==='fantaisie_jeunesse'){lines.push(L('Soci\u00e9t\u00e9 de fantaisie \u00ab jeunesse \u00bb',A,1850));
    if((a.sous_type_jeunesse==='paysans'||a.sous_type_jeunesse==='pierrots')&&a.sortie_mardi_gras_matin===true)lines.push(L('Suppl\u00e9ment sortie du mardi gras au matin (Paysans en musique / Pierrots \u00e0 la viole)',A,600,{note:"Les Arlequins n'y ont pas droit"}));}
   if(t==='petits_gilles')lines.push(L('Petits Gilles',A,3000));
   if(t==='jeune_garde_ou_jeunesse_trad')lines.push(L('900 \u20ac (bal de carnaval) + 900 \u20ac (sortie du lundi gras)',A,1800));
   if(t==='adf')lines.push(L('Association de D\u00e9fense du Folklore',A,1250));
   if(t==='lundi_gras')lines.push(L('1.250 \u20ac + 700 \u20ac (bal d\u2019enfants)',A,1950));
   if(t==='trouilles_de_nouilles')lines.push(L('Association organisatrice des Trouilles de Nouilles',A,325));}
  if(a.zone==='entite'){var e=a.type_societe_e;
   if(e==='gilles')lines.push(L('Soci\u00e9t\u00e9 de gilles (entit\u00e9)',A,1250));
   if(e==='fantaisie')lines.push(L('Soci\u00e9t\u00e9 de fantaisie (entit\u00e9)',A,1000));
   if(e==='groupe_costume_precarnavalesque'){var j=num(a.jours_sortie_precarnaval);lines.push(L(j+' jour(s) de sortie pr\u00e9carnavalesque \u00d7 100 \u20ac',A,j*100));}}
  notes.push('Bar\u00e8me issu de la modification du 19/02/2019 ; les montants 2009 ne valent plus qu\u2019\u00e0 titre historique.');
  return{lines:lines,notes:notes};}},
{id:'kermesses',label:'Comit\u00e9s de kermesses communales',icon:'\ud83c\udfa1',ref:'CC 12/10/2009 pt 22, mod. CC 19/02/2019',teaser:'jusqu\u2019\u00e0 2.000 \u20ac/an',pour:'Vous organisez une kermesse ou une ducasse de quartier.',
 questions:[{id:'jours_festivites',type:'number',label:'Nombre de jours de festivit\u00e9s'}],
 compute:function(a){var lines=[],notes=[];var j=num(a.jours_festivites);var A='art. 4, mod. 2019';
  if(j===1)lines.push(L('1 jour de festivit\u00e9s',A,375));
  else if(j===2)lines.push(L('2 jours de festivit\u00e9s',A,750));
  else if(j>=3)lines.push(L(j+' jours de festivit\u00e9s (3 jours et plus)',A,2000));
  notes.push("Adh\u00e9sion obligatoire d'un membre du Coll\u00e8ge communal au comit\u00e9, comme observateur sans voix d\u00e9lib\u00e9rative (art. 3).");
  notes.push('Aucune r\u00e9trocession du subside, en tout ou partie (art. 5).');
  return{lines:lines,notes:notes};}},
{id:'musicales',label:'Soci\u00e9t\u00e9s musicales et chorales',icon:'\ud83c\udfb5',ref:'CC 12/10/2009 pt 26',teaser:'jusqu\u2019\u00e0 1.050 \u20ac/an',pour:'Vous dirigez une harmonie, une fanfare ou une chorale (min. 20 membres).',
 questions:[
  {id:'type_ensemble',type:'enum',label:"Type d'ensemble",options:[['societe_musicale','Soci\u00e9t\u00e9 musicale (harmonie, fanfare\u2026)'],['chorale','Chorale']]},
  {id:'effectif',type:'number',label:'Nombre de musiciens / participants'}],
 compute:function(a){var lines=[],notes=[];var e=num(a.effectif);
  if(e<20){return{lines:[],notes:["Le r\u00e8glement r\u00e9serve le subside aux ensembles d'au moins 20 musiciens ou participants (art. 3\u20134)."],ineligible:true};}
  if(a.type_ensemble==='societe_musicale')lines.push(L('Soci\u00e9t\u00e9 musicale d\u2019au moins 20 musiciens','art. 3, 5',1050));
  if(a.type_ensemble==='chorale')lines.push(L('Chorale d\u2019au moins 20 participants','art. 4, 5',650));
  return{lines:lines,notes:notes};}},
{id:'patriotiques',label:'Soci\u00e9t\u00e9s patriotiques',icon:'\ud83c\udf96\ufe0f',ref:'CC 12/10/2009 pt 29, mod. CC 20/12/2016',teaser:'jusqu\u2019\u00e0 450 \u20ac/an',pour:'Vous organisez des comm\u00e9morations patriotiques.',
 questions:[{id:'cas_particulier',type:'enum',label:'Situation du groupement',options:[['standard','Groupement patriotique'],['fusionne_ressaix_peronnes','Groupements fusionn\u00e9s F.N.A.P.G. / F.N.A.C. de Ressaix-P\u00e9ronnes'],['fraternelle_b40','Fraternelle Arm\u00e9e secr\u00e8te B 40 de Binche']]},],
 compute:function(a){var lines=[];
  if(a.cas_particulier==='fraternelle_b40')lines.push(L('Seule association organisant les comm\u00e9morations du centre-ville','art. 3, mod. 2016',450));
  else if(a.cas_particulier==='fusionne_ressaix_peronnes')lines.push(L('Groupements fusionn\u00e9s de Ressaix/P\u00e9ronnes','art. 3',250));
  else lines.push(L('Groupement patriotique','art. 3',125));
  return{lines:lines,notes:[]};}},
{id:'one',label:"Sections locales de l'ONE",icon:'\ud83d\udc76',ref:'CC 12/10/2009 pt 30',teaser:'jusqu\u2019\u00e0 297 \u20ac/an',pour:"Vous g\u00e9rez une consultation ONE sur l'entit\u00e9.",
 questions:[{id:'enfants_par_an',type:'number',label:"Nombre d'enfants accueillis par an"}],
 compute:function(a){var lines=[],notes=[];var e=num(a.enfants_par_an);
  if(e<250)lines.push(L('Moins de 250 enfants par an','art. 3',186));
  else lines.push(L('250 enfants et plus par an','art. 3',297));
  if(e===250)notes.push("Le texte dit \u00ab moins de 250 \u00bb et \u00ab plus de 250 \u00bb : le cas d'exactement 250 n'est pas pr\u00e9vu ; lecture retenue : 297 \u20ac.");
  return{lines:lines,notes:notes};}},
{id:'aines',label:'Associations de personnes \u00e2g\u00e9es',icon:'\ud83d\udc75',ref:'CC 12/10/2009 pt 31',teaser:'155 \u20ac/an',pour:"Vous animez une association pour les a\u00een\u00e9s de l'entit\u00e9.",questions:[],
 compute:function(){return{lines:[L('Subside annuel forfaitaire','art. 3',155)],notes:[]};}},
{id:'horticoles',label:'Cercles horticoles et petit \u00e9levage',icon:'\ud83c\udf31',ref:'CC 12/10/2009 pt 32',teaser:'155 \u20ac/an',pour:"Vous favorisez le jardinage, l'embellissement par les plantes ou le petit \u00e9levage.",questions:[],
 compute:function(){return{lines:[L('Subside annuel forfaitaire','art. 4',155)],notes:[]};}},
{id:'photo_cine',label:'Clubs photo, cin\u00e9 et vid\u00e9o',icon:'\ud83d\udcf7',ref:'CC 12/10/2009 pt 27',teaser:'125 \u20ac/an',pour:'Vous animez un club de photo, de cin\u00e9ma ou de vid\u00e9o.',questions:[],
 compute:function(){return{lines:[L('Subside annuel forfaitaire','art. 3',125)],notes:[]};}},
{id:'handicap',label:"\u0152uvres d'aide aux handicap\u00e9s",icon:'\u267f',ref:'CC 12/10/2009 pt 33',teaser:'125 \u20ac/an',pour:"Vous menez une \u0153uvre d'aide aux personnes en situation de handicap.",questions:[],
 compute:function(){return{lines:[L('Subside annuel forfaitaire','art. 3',125)],notes:[]};}},
{id:'ornithologiques',label:'Soci\u00e9t\u00e9s ornithologiques',icon:'\ud83d\udc26',ref:'CC 12/10/2009 pt 28',teaser:'125 \u20ac/an',pour:'Vous animez une soci\u00e9t\u00e9 ornithologique.',questions:[],
 compute:function(){return{lines:[L('Subside annuel forfaitaire','art. 3',125)],notes:[]};}},
{id:'nominatif',label:'Subsides nominatifs (hors bar\u00e8me)',icon:'\ud83d\udccb',ref:'R\u00e8glement g\u00e9n\u00e9ral, art. 22',teaser:'montant fix\u00e9 au budget communal',pour:"Votre association ne rel\u00e8ve d'aucun r\u00e8glement sp\u00e9cifique (social, caritatif, \u00e9ducatif\u2026).",questions:[],
 compute:function(){return{lines:[],notes:["Pas de bar\u00e8me : le montant est fix\u00e9 nominativement par le Conseil communal lors de l'arr\u00eat du budget de l'exercice. Comparez les montants existants dans l'explorateur, ou contactez-nous pour \u00e9valuer votre dossier."],nominatif:true};}}
];
window.SIM={cats:CATS,cg:CG,eur:eur};
})();
