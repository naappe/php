package mv.magnetic.viewer;

import android.app.Activity;
import android.graphics.Color;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
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
        Button calibrate=new Button(this);calibrate.setText("Calibrate baseline");calibrate.setOnClickListener(v->{baseline=(float)Math.sqrt(filteredX*filteredX+filteredY*filteredY+filteredZ*filteredZ);statusView.setText("Baseline calibrated. Move a small magnet near the phone carefully.");});root.addView(calibrate,params(ViewGroup.LayoutParams.WRAP_CONTENT));
        statusView=text("Starting genuine sensor…",15,muted);root.addView(statusView);root.addView(text("Privacy: readings remain on this phone. No internet or location permission is used.",12,muted));return root;
    }

    @Override protected void onResume(){super.onResume();if(magnetometer!=null)manager.registerListener(this,magnetometer,SensorManager.SENSOR_DELAY_GAME);}
    @Override protected void onPause(){super.onPause();manager.unregisterListener(this);}
    @Override public void onSensorChanged(SensorEvent event){
        float a=.18f;if(!initialized){filteredX=event.values[0];filteredY=event.values[1];filteredZ=event.values[2];baseline=(float)Math.sqrt(filteredX*filteredX+filteredY*filteredY+filteredZ*filteredZ);initialized=true;}else{filteredX+=(event.values[0]-filteredX)*a;filteredY+=(event.values[1]-filteredY)*a;filteredZ+=(event.values[2]-filteredZ)*a;}
        float total=(float)Math.sqrt(filteredX*filteredX+filteredY*filteredY+filteredZ*filteredZ),delta=Math.abs(total-baseline);
        totalView.setText(String.format(Locale.US,"%.1f µT",total));axesView.setText(String.format(Locale.US,"X %.1f    Y %.1f    Z %.1f",filteredX,filteredY,filteredZ));deltaView.setText(String.format(Locale.US,"Change from baseline: %.1f µT",delta));
        statusView.setText(delta>20?"Strong magnetic change detected":"Live sensor active");graph.add(total);
    }
    @Override public void onAccuracyChanged(Sensor sensor,int accuracy){}
}
