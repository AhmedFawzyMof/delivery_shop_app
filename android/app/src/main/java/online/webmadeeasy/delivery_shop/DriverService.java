package online.webmadeeasy.delivery_shop;

import android.os.Build;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.location.Location;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.OnFailureListener;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

public class DriverService extends Service {
    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private WebSocket webSocket;
    private OkHttpClient client;
    private String driverId;
    private String driverName, driverCity;
    private String driverOrders = "[]";
    private Integer driverStationedAt;
    private static final String CHANNEL_ID = "DriverServiceChannel";

    private final BroadcastReceiver updateReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent.hasExtra("driver_orders")) {
                driverOrders = intent.getStringExtra("driver_orders");
            }

            if (intent.hasExtra("driver_city")) {
                driverCity = intent.getStringExtra("driver_city");
                
                if (webSocket != null) {
                    String cityJson = "{\"type\":\"city_update\",\"driver_id\":\"" + driverId + "\",\"city\":\"" + driverCity + "\"}";
                    webSocket.send(cityJson);
                }            
            }

            if (intent.hasExtra("driver_stationed_at")) {
                driverStationedAt = intent.getIntExtra("driver_stationed_at", -1);
            }
            
            Log.d("DriverService", "Native data updated via Broadcast");
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        client = new OkHttpClient();
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
        setupLocationCallback();
        IntentFilter filter = new IntentFilter("com.delivery.UPDATE_DRIVER_DATA");
        registerReceiver(updateReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
    }

   @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            driverId = intent.getStringExtra("driver_id");
            driverName = intent.getStringExtra("driver_name");
            driverCity = intent.getStringExtra("driver_city");
            driverOrders = intent.getStringExtra("driver_orders");
            driverStationedAt = intent.getIntExtra("driver_stationed_at", -1);
        }

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Delivery Shop")
                .setContentText("تتبع الموقع نشط الآن...")
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setOngoing(true) 
                .build();

        startForeground(1, notification);

        // Keep these three - remove the extra setupLocationCallback() call
        setupLocationCallback(); 
        startWebSocket();
        startLocationUpdates();
        
        return START_STICKY;
    }

    private void createNotificationChannel() {
        NotificationChannel serviceChannel = new NotificationChannel(
                CHANNEL_ID,
                "Driver Background Channel",
                NotificationManager.IMPORTANCE_LOW 
        );
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(serviceChannel);
        }
    }

    private void setupLocationCallback() {
        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult == null || webSocket == null || driverId == null) return;

                Location location = locationResult.getLastLocation();
                if (location != null) {
                    // Formatting the JSON correctly for the server
                    String ordersJson = (driverOrders != null && !driverOrders.isEmpty()) ? driverOrders : "[]";
                    
                    String locJson = "{" +
                        "\"type\":\"location_update\"," +
                        "\"driver_id\":\"" + driverId + "\"," +
                        "\"location\":{\"lat\":" + location.getLatitude() + ",\"lng\":" + location.getLongitude() + "}," +
                        "\"driver_stationed_at\":" + ((driverStationedAt == -1) ? "null" : driverStationedAt) + "," +
                        "\"driver_orders\":" + ordersJson + "," +
                        "\"timestamp\":" + System.currentTimeMillis() +
                    "}";

                    webSocket.send(locJson);
                    Log.d("DriverService", "Location Sent to WebSocket");
                }
            }
        };
    }

    private void startLocationUpdates() {
        LocationRequest locationRequest = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 30000)
                .setMinUpdateIntervalMillis(15000)
                .build();

        try {
            fusedLocationClient.requestLocationUpdates(locationRequest,
                    locationCallback, Looper.getMainLooper());
        } catch (SecurityException e) {
            Log.e("DriverService", "Location permission missing!");
        }
    }

    private void startWebSocket() {
        Request request = new Request.Builder()
                .url("wss://deliveryshop.cloud")
                .build();

        webSocket = client.newWebSocket(request, new WebSocketListener() {
        @Override
        public void onOpen(WebSocket webSocket, Response response) {
            Log.d("DriverService", "WebSocket Connected! Fetching location for Init...");

            // Use a try-catch to prevent the entire Service from crashing on a null pointer
            try {
                fusedLocationClient.getLastLocation().addOnSuccessListener(new OnSuccessListener<Location>() {
                    @Override
                    public void onSuccess(Location location) {
                        double lat = (location != null) ? location.getLatitude() : 0.0;
                        double lng = (location != null) ? location.getLongitude() : 0.0;

                        String stationedValue = (driverStationedAt == null || driverStationedAt == -1) ? "null" : driverStationedAt.toString();
                        String ordersValue = (driverOrders != null && !driverOrders.isEmpty() && !driverOrders.equals("null")) 
                                            ? driverOrders : "[]";

                        // Clean manual JSON construction
                        String initJson = "{" +
                            "\"type\":\"driver_init\"," +
                            "\"driver_id\":\"" + driverId + "\"," +
                            "\"driver_name\":\"" + (driverName != null ? driverName : "Driver") + "\"," +
                            "\"driver_type\":\"driver\"," +
                            "\"driver_city\":\"" + (driverCity != null ? driverCity : "Unknown") + "\"," +
                            "\"driver_status\":\"READY\"," +
                            "\"location\":{\"lat\":" + lat + ",\"lng\":" + lng + "}," + 
                            "\"driver_stationed_at\":" + stationedValue + "," +
                            "\"driver_orders\":" + ordersValue +
                            "}";

                        Log.d("DriverService", "Sending Init: " + initJson);
                        webSocket.send(initJson);
                    }
                }).addOnFailureListener(e -> {
                    // If GPS hardware is completely off, still send the init so the driver shows up as "Offline" or "Last Known"
                    String fallback = "{\"type\":\"driver_init\",\"driver_id\":\"" + driverId + "\",\"driver_status\":\"READY\"}";
                    webSocket.send(fallback);
                });
            } catch (Exception e) {
                Log.e("DriverService", "Fatal error in onOpen", e);
            }
        }
        @Override
        public void onMessage(WebSocket webSocket, String text) {
                Log.d("DriverService", "Received: " + text);
                
               if (text.contains("new_orders_nearby")) {
                    sendOrderNotification("📦 طلبات جديدة بالقرب منك", "هناك طلبات متاحة الآن، افتح التطبيق للمعاينة");
                }

                if (text.contains("new_order_nearby")) {
                    sendOrderNotification("📦 طلب جديد", "يوجد طلب جديد متاح حالياً");
                }
                if (text.contains("order_status_updated") && text.contains("ready")) {
                    sendOrderNotification("✅ الطلب جاهز", "الطلب الآن جاهز للاستلام من المطعم");
                }

                Intent intent = new Intent("com.delivery.SWIFT_UI_UPDATE");
                intent.putExtra("payload", text);
                sendBroadcast(intent);
            }

            @Override
            public void onClosed(WebSocket webSocket, int code, String reason) {
                reconnect();
            }

            @Override
            public void onFailure(WebSocket webSocket, Throwable t, @Nullable Response response) {
                reconnect();
            }
        });
    }

    private void reconnect() {
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            if (driverId != null) {
                startWebSocket();
            }
        }, 5000);
    }

    private void sendOrderNotification(String title, String message) {
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        String channelId = "orders_channel";

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(channelId, "Orders", NotificationManager.IMPORTANCE_HIGH);
            notificationManager.createNotificationChannel(channel);
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info) // Replace with your app icon
                .setContentTitle(title)
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true);

        notificationManager.notify((int) System.currentTimeMillis(), builder.build());
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        fusedLocationClient.removeLocationUpdates(locationCallback);
        if (webSocket != null) webSocket.close(1000, "Service Destroyed");
        driverId = null; 
        unregisterReceiver(updateReceiver);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}