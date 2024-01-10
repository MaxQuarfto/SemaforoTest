const verdeSalita = (verdeDiscesa = 10); //tempo di semaforo verdeDiscesa in secondi
const rosso = 50; //tempo per percorrere il tratto in secondi

let gui;
let bottoneWarning;
let bottoneAudio;
let bottoneCambiaNome;
let checkGhiaccio;
let checkTrattore;
let etichettaSemaforo;

let statoSem = "arancione";
let statoSemOld = "arancione";
let scritta = "Attesa connessione";
let colAltoSemSu = "orange";
let colCentroSemSu = "orange";
let colBassoSemSu = "orange";
let colAltoSemGiu = "orange";
let colCentroSemGiu = "orange";
let colBassoSemGiu = "orange";
let gotServerTime = 0;
let serverTime;
let time;
let errorMessage;
let parla;
let logo;
let datePreJson;
let datePostJson;
let dateAdj;
let timeLoadJson;
let blink = 0;
let attesaSalita;
let attesaDiscesa;
let finestra;
let largh;
let alt;
let orient = "portrait";
let larghOrig;
let altOrig;

let gotMqtt = false; //lo stato della connessione mqtt
let gotMqttSubscribe = false;

let nome = "";
//var client = mqtt.connect("wss://test.mosquitto.org:8081/mqtts", {connectTimeout: 3000,keepalive: 10});
var client = mqtt.connect("wss://test.mosquitto.org:8081/mqtts", { keepalive: 10, });

function preload() {
  logo = loadImage("LogoADVtrasp.png");
}

function setup() {
  window.matchMedia("(orientation: portrait)").addEventListener("change", changeOrien);
  parla = new p5.Speech(); // speech synthesis object
  parla.setLang("it-IT");
  createCanvas(windowWidth, windowHeight);
  largh = windowWidth;
  alt = windowHeight;
  larghOrig = windowWidth;
  altOrig = windowHeight;

  heartBeat();
  textSize(alt / 40);
  gui = createGui();
  //gui.setTextSize(40);

  bottoneAudio = createButton("Abilita audio", (largh / 16) * 9, (alt / 12) * 6.5, largh / 4, alt / 15);
  bottoneAudio.setStyle({ "fillBg": color(200, 200, 0), "textSize": (alt / 40) });

  bottoneWarning = createButton("Salite e scendete con attenzione. \n" +
    "Potreste incontrare qualcuno \n" +
    "senza applicazione!!",
    5, ((alt / 11) * 2), largh / 2, alt / 10);
  bottoneWarning.setStyle({ "fillBg": color(255, 0, 0), "textSize": (alt / 50) });

  bottoneCambiaNome = createButton('Cambia nome', largh / 4, alt / 7.5, largh / 4, alt / 30);
  bottoneCambiaNome.setStyle({ "fillBg": color(200, 200, 200), "textSize": (alt / 50) });

  etichettaSemaforo = createButton('', largh / 4, (alt / 20) * 15, largh / 2, alt / 20);
  etichettaSemaforo.setStyle({ "fillLabel": color(255, 0, 0), "fillBg": color(200, 200, 200), "textSize": alt / 25 });

  checkGhiaccio = createToggle("Ghiaccio", largh / 10, alt - alt / 5.5, largh / 4, alt / 30);
  checkGhiaccio.setStyle({ fillBgOn: color(250, 0, 0), fillBgOnActive: color(250, 10, 0), fillBgOnHover: color(250, 10, 10) });
  checkGhiaccio.setStyle({ fillBgOff: color(0, 250, 0), fillBgOffActive: color(50, 250, 0), fillBgOffHover: color(0, 250, 50) });
  checkGhiaccio.setStyle({ textSize: alt / 60 });

  checkTrattore = createToggle("Trattore", largh / 10, alt - alt / 7, largh / 4, alt / 30);
  checkTrattore.setStyle({ fillBgOn: color(250, 0, 0), fillBgOnActive: color(250, 10, 0), fillBgOnHover: color(250, 10, 10) });
  checkTrattore.setStyle({ fillBgOff: color(0, 250, 0), fillBgOffActive: color(50, 250, 0), fillBgOffHover: color(0, 250, 50) });
  checkTrattore.setStyle({ textSize: alt / 60 });

  client.on("connect", mqttConnect);
  client.on("message", mqttMessaggio);
  client.on("error", mqttError);
  client.on("connect_failed", mqttConnectFailed);

  nome = getItem("Nome");
  console.log(nome);
  if (nome == null) {
    nome = prompt("Come ti chiami?");
    storeItem("Nome", nome);
  }

  textAlign(CENTER);
  ellipseMode(CENTER);
}

function draw() {
  if (blink > 1) {
    blink = blink - 1;
    if (blink % 2 == 1) {
      background(0);
    } else {
      background(255);
    }
  } else {
    background(150, 150, 200);
  }
  image(logo, 0, 0, min(alt, largh) / 6, min(alt, largh) / 6);
  disegnaSemaforo((largh / 16) * 9, alt / 10, colAltoSemSu, colCentroSemSu, colBassoSemSu, "MONTE", attesaDiscesa);
  disegnaSemaforo((largh / 16) * 4, (alt / 10) * 3, colAltoSemGiu, colCentroSemGiu, colBassoSemGiu, "VALLE", attesaSalita);
  statoSem = semaforo();
  if (statoSem == "arancione" || gotServerTime == 0) {
    scritta = "Attesa connessione";
    colAltoSemSu = "orange";
    colCentroSemSu = "orange";
    colBassoSemSu = "orange";
    colAltoSemGiu = "orange";
    colCentroSemGiu = "orange";
    colBassoSemGiu = "orange";
  } else {
    if (statoSem == "aspetta") {
      scritta = "ASPETTA";
      colAltoSemSu = "red";
      colCentroSemSu = "black";
      colBassoSemSu = "black";
      colAltoSemGiu = "red";
      colCentroSemGiu = "black";
      colBassoSemGiu = "black";
    }
    if (statoSem == "sali") {
      scritta = "PUOI SALIRE";
      colAltoSemSu = "red";
      colCentroSemSu = "black";
      colBassoSemSu = "black";
      colAltoSemGiu = "black";
      colCentroSemGiu = "black";
      colBassoSemGiu = "lightgreen";
    }
    if (statoSem == "scendi") {
      scritta = "PUOI SCENDERE";
      colAltoSemSu = "black";
      colCentroSemSu = "black";
      colBassoSemSu = "lightgreen";
      colAltoSemGiu = "red";
      colCentroSemGiu = "black";
      colBassoSemGiu = "black";
    }
    MqttStatus();
    push();
    fill("yellow");
    textAlign(CENTER, CENTER);
    rect(largh / 4, alt / 15, largh / 4, alt / 15);
    fill("black");
    text("Benvenuto \n" + nome, largh / 4 + largh / 4 / 2, alt / 15 + alt / 15 / 2);
    pop();
  }

  etichettaSemaforo.label = scritta;
  if (statoSem != statoSemOld) {
    statoSemOld = statoSem;
    parla.setVoice(4);
    parla.speak(scritta);
    blink = 30;
  }
  if (errorMessage) {
    textSize(alt / 40);
    fill("red");
    text(errorMessage, largh / 2, (alt - alt / 12));
  }
  debug();
  if (bottoneCambiaNome.isPressed) {
    cambiaNome();
    console.log("schiacciato");
  }
  if (checkGhiaccio.isPressed) allGhiaccioCambiato();
  if (checkTrattore.isPressed) allTrattoreCambiato();
  drawGui();
}


function heartBeat() {
  datePreJson = new Date();
  loadJSON("https://worldtimeapi.org/api/ip", gotData, gotError);
  waitForServerTime();
}

function gotData(data) {
  serverTime = data.unixtime;
  datePostJson = new Date();
  timeLoadJson = datePostJson - datePreJson;
  if (timeLoadJson > 1000) {
    //più di 1 secondo nel caricare il JSON
    gotServerTime = 0;
    errorMessage =
      "Eccesso di tempo nel caricare Json :" + timeLoadJson + " ms";
  }

  date = new Date();
  localTime = round(date.getTime() / 1000);
  if (abs(localTime - serverTime) < 120) {
    //max di 2 minuti di discrepanza
    dateAdj = localTime - serverTime;
    gotServerTime = 1;
    errorMessage = "";
  } else {
    gotServerTime = 0;
    errorMessage =
      "Controlla sincronia orologio." +
      "\n" +
      "Locale: " +
      convertUnixTime(localTime) +
      " Server: " +
      convertUnixTime(serverTime);
    //throw new Error('Controlla sincronia orologio.' + '\n'+"Locale: "+ convertUnixTime(localTime)+
    //" Server: "+ convertUnixTime(serverTime));
  }
  setTimeout(heartBeat, 10000); // Adjust the time interval as needed
}

function gotError() {
  //throw new Error("Error caricando microservizio tempo");
  gotServerTime = 0;
  errorMessage = "Error caricando microservizio tempo";
  loadJSON("https://worldtimeapi.org/api/ip", gotData, gotError);
}

function waitForServerTime() {
  if (typeof serverTime !== "undefined") {
    //   console.log("Server time definito: ",convertUnixTime(serverTime));
  } else {
    //console.log("waiting for ServerTime to be defined");
    errorMessage = "waiting for ServerTime to be defined";
    setTimeout(waitForServerTime, 1000); // Adjust the time interval as needed
  }
}

function semaforo() {
  if (!gotServerTime) return;
  time = Date.now() - dateAdj * 1000;
  finestra =
    (time % ((verdeSalita + rosso + verdeDiscesa + rosso) * 1000)) / 1000;
  if (Math.floor(finestra) < verdeSalita) {
    messaggio = "sali";
  }
  if (
    Math.floor(finestra) >= verdeSalita &&
    Math.floor(finestra) < verdeSalita + rosso
  ) {
    messaggio = "aspetta";
  }
  if (
    Math.floor(finestra) >= verdeSalita + rosso &&
    Math.floor(finestra) < verdeSalita + rosso + verdeDiscesa
  ) {
    messaggio = "scendi";
  }
  if (Math.floor(finestra) >= verdeSalita + rosso + verdeDiscesa) {
    messaggio = "aspetta";
  }
  if (Math.floor(finestra) < verdeSalita + rosso) {
    attesaDiscesa = verdeSalita + rosso - Math.floor(finestra);
  } else {
    attesaDiscesa = verdeSalita + rosso + (verdeSalita + rosso + verdeDiscesa + rosso - Math.floor(finestra));
  }
  attesaSalita = verdeSalita + rosso + verdeDiscesa + rosso - Math.floor(finestra);
  return messaggio;
}

function disegnaSemaforo(x, y, colAlto, colMezzo, colBasso, descrizione, tempoAttesa) {
  fill("darkGreen"); //grey color
  larghezza = largh / 4;
  altezza = alt / 2.5;
  rect(x, y, larghezza, altezza, 20); //traffic light base
  fill(colAlto);
  ellipse(x + larghezza / 2, y + altezza / 4, larghezza / 1.2, altezza / 4.2); //first light
  fill(colMezzo);
  ellipse(x + larghezza / 2, y + (altezza / 4) * 2, larghezza / 1.2, altezza / 4.2); //second light
  fill(colBasso);
  ellipse(
    x + larghezza / 2, y + (altezza / 4) * 3, larghezza / 1.2, altezza / 4.2); //third code
  textSize(alt / 40);
  fill("orange");
  text(descrizione + " " + tempoAttesa, x + larghezza / 2, y + altezza / 10);
}

function convertUnixTime(uTime) {
  // Create a new JavaScript Date object based on the timestamp
  // multiplied by 1000 so that the argument is in milliseconds, not seconds
  var date = new Date(uTime * 1000);
  var hours = date.getHours();
  var minutes = "0" + date.getMinutes();
  var seconds = "0" + date.getSeconds();
  var formattedTime =
    hours + ":" + minutes.substr(-2) + ":" + seconds.substr(-2);
  return formattedTime;
}

function debug() {
  push();
  textSize(alt / 60);
  fill(130);
  text("Loc: " + convertUnixTime(Date.now() / 1000) + " Rem " + convertUnixTime(time / 1000) + " adj " + dateAdj +
    " loadJson " + timeLoadJson +
    "\n v 10.0 larg " + largh + " alt " + alt + " " + screen.orientation.type + " " + info() + " MQTT " + gotMqtt, 5, (alt / 30) * 28, largh, alt / 3);
  pop();
}

function cambiaNome() {
  nome = prompt("Come ti chiami?");
  storeItem("Nome", nome);
}

function MqttStatus() {
  gotMqtt = client.connected;
  if (gotMqtt && gotMqttSubscribe) {
    //    coloreSfondo = "lightgreen";

  } else {
    checkGhiaccio.label = "Sistema allarmi non disponibile";
    checkTrattore.label = "Sistema allarmi non disponibile";
  }
}

function mqttConnect() {
  client.subscribe("ADV/#", function (err) {
    if (!err) {
      gotMqttSubscribe = true;
    } else {
      console.log("Error in MQTT subscribe");
      gotMqttSubscribe = false;
    }
  });
}
function allGhiaccioCambiato() {
  if (checkGhiaccio.val) {
    scriviMqtt("ADV/Ghiaccio", "ON," + nome);
  } else {
    scriviMqtt("ADV/Ghiaccio", "OFF," + nome);
  }
}
function allTrattoreCambiato() {
  if (checkTrattore.val) {
    scriviMqtt("ADV/Trattore", "ON," + nome);
  } else {
    scriviMqtt("ADV/Trattore", "OFF," + nome);
  }
}

function scriviMqtt(topic, payload) {
  if (client.connected) {
    //    client.publish(topic, payload+" "+hour()+":"+minute(),{ qos: 2, retain: true },
    client.publish(topic, payload + " " + hour() + ":" + minute().toString().padStart(2, '0'), { qos: 2, retain: true },
      function (complete) { console.log("publish complete with code: " + complete); },
      function (error) {
        console.log("error on publish: " + (error.reason || "unknown"));
      }
    );
  }
}

function mqttMessaggio(topic, message) {
  let splitString = split(message.toString(), ",");
  console.log(topic + " " + message.toString());
  if (topic == "ADV/Trattore") {
    if (splitString[0] == "ON") {
      checkTrattore.val = true;
      checkTrattore.label = "Trattore " + splitString[1];
    } else {
      checkTrattore.val = false;
      checkTrattore.label = "Trattore ";
    }
  }
  if (topic == "ADV/Ghiaccio") {
    if (splitString[0] == "ON") {
      checkGhiaccio.val = true;
      checkGhiaccio.label = "Ghiaccio " + splitString[1];
    } else {
      checkGhiaccio.val = false;
      checkGhiaccio.label = "Ghiaccio ";
    }
  }
}

function mqttConnectFailed(message) {
  console.log("mqtt error ", message);
}

function mqttError(message) {
  console.log("mqtt error ", message);
}

function changeOrien(e) {
  const portrait = e.matches;
  if (portrait) {
    largh = larghOrig;
    alt = altOrig;
    console.log("port");
  } else {
    //largh=larghOrig*larghOrig/altOrig*0.7;
    //alt=larghOrig*0.7;
    largh = (windowHeight * altOrig) / larghOrig;
    alt = windowHeight;
    console.log("land");
  }
  resizeCanvas(largh, alt);


  bottoneWarning.x = 5;
  bottoneWarning.y = (alt / 11) * 2;
  bottoneWarning.w = largh / 2;
  bottoneWarning.h = alt / 10;
  bottoneWarning.setStyle({ "fillBg": color(255, 0, 0), "textSize": (alt / 50) });


  bottoneCambiaNome.x = largh / 4;
  bottoneCambiaNome.y = alt / 7.5;
  bottoneCambiaNome.w = largh / 4;
  bottoneCambiaNome.h = alt / 30;
  bottoneCambiaNome.setStyle({ "fillBg": color(200, 200, 0) });

  checkGhiaccio.x = largh / 10;
  checkGhiaccio.y = alt - (alt / 5.5);

  checkTrattore.x = largh / 10;
  checkTrattore.y = alt - alt / 7;

  console.log(largh, alt, windowWidth, windowHeight, larghOrig, altOrig);
}