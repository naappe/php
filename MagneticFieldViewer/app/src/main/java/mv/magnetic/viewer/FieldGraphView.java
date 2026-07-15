package mv.magnetic.viewer;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.view.View;
import java.util.ArrayDeque;

public final class FieldGraphView extends View {
    private final ArrayDeque<Float> values = new ArrayDeque<>();
    private final Paint line = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint grid = new Paint(Paint.ANTI_ALIAS_FLAG);

    public FieldGraphView(Context context) {
        super(context);
        line.setColor(Color.rgb(52, 213, 230)); line.setStrokeWidth(5f); line.setStyle(Paint.Style.STROKE);
        grid.setColor(Color.rgb(36, 54, 77)); grid.setStrokeWidth(2f);
        setBackgroundColor(Color.rgb(9, 22, 38));
    }

    public void add(float value) {
        if (values.size() >= 120) values.removeFirst();
        values.addLast(value); invalidate();
    }

    @Override protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        int w=getWidth(), h=getHeight();
        for(int i=1;i<4;i++) canvas.drawLine(0,h*i/4f,w,h*i/4f,grid);
        if(values.size()<2)return;
        float max=80f; for(float v:values)max=Math.max(max,v);
        float step=w/(float)(values.size()-1), previousX=0, previousY=h;
        int index=0; for(float v:values){float x=index*step,y=h-(Math.min(v,max)/max)*(h-10);if(index>0)canvas.drawLine(previousX,previousY,x,y,line);previousX=x;previousY=y;index++;}
    }
}
