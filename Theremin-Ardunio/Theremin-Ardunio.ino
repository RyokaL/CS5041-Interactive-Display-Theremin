 int ldrFreqLow = 1023;
 int ldrFreqHigh = 0;
 int ldrVolLow = 1023;
 int ldrVolHigh = 0;

 int ldrFreqRead = 0;
 int ldrVolRead = 0;

 int delayVal = 250;

 const int onBoardLED = 13;
 
 void setup() {
  Serial.begin(9600);
  pinMode(onBoardLED, OUTPUT);
  digitalWrite(onBoardLED, HIGH);

  pinMode(7, OUTPUT);
  digitalWrite(7, HIGH);
  pinMode(4, OUTPUT);
  digitalWrite(4, HIGH);
  
  while(millis() < 5000) {
    ldrFreqRead = analogRead(A5);
    ldrVolRead = analogRead(A0);

    if(ldrFreqRead > ldrFreqHigh) {
      ldrFreqHigh = ldrFreqRead;
    }

    if(ldrFreqRead < ldrFreqLow) {
      ldrFreqLow = ldrFreqRead;
    }

    if(ldrVolRead > ldrVolHigh) {
      ldrVolHigh = ldrVolRead;
    }

    if(ldrVolRead < ldrVolLow) {
      ldrVolLow = ldrVolRead;
    }
  }
  digitalWrite(onBoardLED, LOW);
}

float mapF(float x, float in_min, float in_max, float out_min, float out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

void loop() {

  if(Serial.available() > 0) {
    String inp = Serial.readStringUntil('\n');
    if(inp.charAt(0) == 't') {
      inp = inp.substring(1);
      delayVal = inp.toInt();
    }
  }
  
  ldrFreqRead = analogRead(A5);
  ldrVolRead = analogRead(A0);

  if(ldrFreqRead > ldrFreqHigh) {
      ldrFreqHigh = ldrFreqRead;
    }

    if(ldrFreqRead < ldrFreqLow) {
      ldrFreqLow = ldrFreqRead;
    }

    if(ldrVolRead > ldrVolHigh) {
      ldrVolHigh = ldrVolRead;
    }

    if(ldrVolRead < ldrVolLow) {
      ldrVolLow = ldrVolRead;
    }
  
//  Serial.write(ldrFreqRead);
//  Serial.flush();

  int pitch = map(ldrFreqRead, ldrFreqLow, ldrFreqHigh, 0, 1000);

  int newMapF = map(ldrFreqRead, ldrFreqLow, ldrFreqHigh, 0, 127);
  newMapF = constrain(newMapF, 0, 127);

  float newMapV = mapF(ldrVolRead, ldrVolLow, ldrVolHigh, 0, 1);

  String outpFreq = "f" + String(newMapF);
  String outpVol = "v" + String(newMapV);
  
  Serial.println(outpFreq);
  Serial.flush();

  Serial.println(outpVol);
  Serial.flush();
  
  tone(8, pitch, 200);

  delay(delayVal);
}
