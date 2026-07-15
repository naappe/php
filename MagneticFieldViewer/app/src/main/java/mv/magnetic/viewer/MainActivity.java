package mv.magnetic.viewer;

import android.app.Activity;
import android.graphics.Color;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioTrack;
import android.os.Bundle;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.util.Locale;

public final class MainActivity extends Activity implements SensorEventListener {
    private SensorManager manager; private Sensor magnetometer;
    private TextView totalView, axesView, deltaView, statusView; private FieldGraphView graph;
    private float filteredX,filteredY,filteredZ,baseline; private boolean initialized;
    private static final double SCAN_HZ=37.0;
    private volatile boolean scanActive;
    private volatile long scanStartNs;
    private double scanSin,scanCos,emptyResponse=Double.NaN;
    private int scanSamples;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state); manager=(SensorManager)getSystemService(SENSOR_SERVICE);
        magnetometer=manager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD); setContentView(buildUi());
        if(magnetometer==null) statusView.setText("No magnetometer exists on this phone.");
    }

    private TextView text(String value,int size,int color){TextView view=new TextView(this);view.setText(value);view.setTextSize(size);view.setTextColor(color);view.setGravity(Gravity.CENTER);view.setPadding(12,12,12,12);return view;}
    private LinearLayout.LayoutParams params(int height){return new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,height);}
    private LinearLayout buildUi(){
        int cyan=Color.rgb(52,213,230),white=Color.rgb(238,247,255),muted=Color.rgb(158,177,199);
        LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setPadding(28,30,28,28);root.setBackgroundColor(Color.rgb(7,17,31));
        root.addView(text("🧲 Magnetic Field Viewer",28,white));root.addView(text("Real Android magnetometer · values in microtesla (µT)",14,muted));
        totalView=text("— µT",46,cyan);root.addView(totalView);axesView=text("X —    Y —    Z —",18,white);root.addView(axesView);
        deltaView=text("Change from baseline: —",16,muted);root.addView(deltaView);
        graph=new FieldGraphView(this);LinearLayout.LayoutParams gp=params(0);gp.weight=1;gp.setMargins(0,20,0,20);root.addView(graph,gp);
        Button calibrate=new Button(this);calibrate.setText("Calibrate magnetic baseline");calibrate.setOnClickListener(v->{baseline=(float)Math.sqrt(filteredX*filteredX+filteredY*filteredY+filteredZ*filteredZ);statusView.setText("Magnetic baseline calibrated.");});root.addView(calibrate,params(ViewGroup.LayoutParams.WRAP_CONTENT));
        Button empty=new Button(this);empty.setText("1. Capture empty active scan");empty.setOnClickListener(v->startActiveScan(true));root.addView(empty,params(ViewGroup.LayoutParams.WRAP_CONTENT));
        Button object=new Button(this);object.setText("2. Scan nearby object");object.setOnClickListener(v->startActiveScan(false));root.addView(object,params(ViewGroup.LayoutParams.WRAP_CONTENT));
        statusView=text("Starting genuine sensor…",15,muted);root.addView(statusView);root.addView(text("Privacy: readings remain on this phone. No internet or location permission is used.",12,muted));return root;
    }

    @Override protected void onResume(){super.onResume();if(magnetometer!=null)manager.registerListener(this,magnetometer,SensorManager.SENSOR_DELAY_GAME);}
    @Override protected void onPause(){super.onPause();scanActive=false;manager.unregisterListener(this);}
    @Override public void onSensorChanged(SensorEvent event){
        float a=.18f;if(!initialized){filteredX=event.values[0];filteredY=event.values[1];filteredZ=event.values[2];baseline=(float)Math.sqrt(filteredX*filteredX+filteredY*filteredY+filteredZ*filteredZ);initialized=true;}else{filteredX+=(event.values[0]-filteredX)*a;filteredY+=(event.values[1]-filteredY)*a;filteredZ+=(event.values[2]-filteredZ)*a;}
        float total=(float)Math.sqrt(filteredX*filteredX+filteredY*filteredY+filteredZ*filteredZ),delta=Math.abs(total-baseline);
        totalView.setText(String.format(Locale.US,"%.1f µT",total));axesView.setText(String.format(Locale.US,"X %.1f    Y %.1f    Z %.1f",filteredX,filteredY,filteredZ));deltaView.setText(String.format(Locale.US,"Change from baseline: %.1f µT",delta));
        statusView.setText(delta>20?"Strong magnetic change detected":"Live sensor active");graph.add(total);
        if(scanActive){double seconds=(event.timestamp-scanStartNs)/1_000_000_000.0,phase=2.0*Math.PI*SCAN_HZ*seconds;scanSin+=total*Math.sin(phase);scanCos+=total*Math.cos(phase);scanSamples++;}
    }
    private void startActiveScan(boolean captureEmpty){
        if(scanActive){statusView.setText("A scan is already running.");return;}
        if(!captureEmpty&&Double.isNaN(emptyResponse)){statusView.setText("Capture the empty scan first.");return;}
        scanSin=0;scanCos=0;scanSamples=0;scanStartNs=System.nanoTime();scanActive=true;
        statusView.setText(captureEmpty?"Empty scan: keep metal away and phone still…":"Object scan: hold the object beside the lower speaker…");
        new Thread(()->{
            playScanTone(2600);
            scanActive=false;
            double response=scanSamples<4?Double.NaN:2.0*Math.hypot(scanSin,scanCos)/scanSamples;
            runOnUiThread(()->{
                if(Double.isNaN(response)){statusView.setText("Not enough sensor samples. This phone cannot run active scan.");return;}
                if(captureEmpty){emptyResponse=response;statusView.setText(String.format(Locale.US,"Empty response saved: %.3f µT. Now place an object near the speaker and scan.",response));}
                else{double change=response-emptyResponse,percent=100.0*Math.abs(change)/Math.max(emptyResponse,0.001);statusView.setText(String.format(Locale.US,"Active response %.3f µT · change %+.3f µT (%.1f%%). Repeat to confirm.",response,change,percent));}
            });
        },"active-metal-scan").start();
    }
    private void playScanTone(int durationMs){
        int rate=44100,count=rate*durationMs/1000;short[] samples=new short[count];
        for(int i=0;i<count;i++){double fade=Math.min(1.0,Math.min(i/(rate*.08),(count-i)/(rate*.08)));samples[i]=(short)(Math.sin(2*Math.PI*SCAN_HZ*i/rate)*Short.MAX_VALUE*.72*fade);}
        AudioTrack track=new AudioTrack.Builder().setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()).setAudioFormat(new AudioFormat.Builder().setEncoding(AudioFormat.ENCODING_PCM_16BIT).setSampleRate(rate).setChannelMask(AudioFormat.CHANNEL_OUT_MONO).build()).setBufferSizeInBytes(samples.length*2).setTransferMode(AudioTrack.MODE_STATIC).build();
        track.write(samples,0,samples.length);track.play();try{Thread.sleep(durationMs+100L);}catch(InterruptedException ignored){Thread.currentThread().interrupt();}track.stop();track.release();
    }
    @Override public void onAccuracyChanged(Sensor sensor,int accuracy){}
}
