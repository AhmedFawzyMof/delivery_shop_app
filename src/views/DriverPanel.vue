<script setup lang="ts">
import { useOrdersStore } from "@/stores/orders";
import { useDriverTracker } from "@/composables/useDriverTraker";
import { computed, onMounted, ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Wifi, WifiOff, DollarSign, CheckCircle, Star } from "lucide-vue-next";
import DriverOrders from "@/components/DriverOrders.vue";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { httpRequest } from "@/utils/http";
import OrderHistory from "@/components/OrderHistory.vue";

const ordersStore = useOrdersStore();
const { isOnline, goOnline, goOffline } = useDriverTracker();
const authStore = useAuthStore();
const router = useRouter();

const completedToday = ref(0);
const todayEarnings = ref(0);
const orders = computed(() => ordersStore.orders);

async function getDriverData() {
  try {
    const res = await httpRequest<{
      status: {
        completedToday: number;
        todayEarnings: number;
        sumOfOrders: number;
      };
    }>({
      url: `/api/driver/${authStore.driver?.driver_id}`,
      method: "GET",
    });

    completedToday.value = res.status.completedToday;
    todayEarnings.value = res.status.todayEarnings;
  } catch (err: any) {
    console.error("Failed to fetch driver data:", err);
  }
}

onMounted(() => {
  authStore.checkSession();
  if (!authStore.isAuthenticated) {
    authStore.logout();
    router.push("/");
  }
  getDriverData();
});

watch(
  () => orders.value,
  () => {
    getDriverData();
  }
);
</script>

<template>
  <header
    dir="rtl"
    class="flex items-center justify-between px-4 py-3 shadow-md"
  >
    <div class="details flex items-center gap-2">
      <div class="avatar w-12 h-12 bg-primary rounded-full relative">
        <p
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-2xl text-white"
        >
          {{ authStore.driver?.driver_full_name.split("")[0] }}
        </p>
      </div>
      <div>
        <p class="font-bold">
          {{ authStore.driver?.driver_full_name.split(" ")[0] }}
        </p>
        <p class="text-xs text-gray-400">Driver Dashboard</p>
      </div>
    </div>

    <Button
      :disabled="orders.length > 0"
      @click="isOnline ? goOffline() : goOnline()"
      class="flex items-center gap-2 relative bg-primary rounded shadow w-10 h-10"
    >
      <span class="text-white">
        <Wifi v-if="isOnline" class="" />
        <WifiOff v-else />
      </span>
    </Button>
  </header>
  <Tabs dir="rtl" default-value="current-orders" class="w-full">
    <TabsList class="grid w-full grid-cols-2">
      <TabsTrigger value="current-orders">الطلبات الحالية</TabsTrigger>
      <TabsTrigger value="order-history">سجل الطلبات</TabsTrigger>
    </TabsList>
    <TabsContent value="current-orders">
      <div class="p-6">
        <div dir="rtl" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader
              class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
              <CardTitle class="text-sm font-medium">أرباح اليوم</CardTitle>
              <DollarSign class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold text-primary">
                {{ todayEarnings.toFixed(2) }}
              </div>
              <p class="text-xs text-muted-foreground">
                من {{ completedToday }} توصيلات
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
              <CardTitle class="text-sm font-medium">التوصيلات</CardTitle>
              <CheckCircle class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold text-green-500">
                {{ completedToday }}
              </div>
              <p class="text-xs text-muted-foreground">اكتملت اليوم</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
              <CardTitle class="text-sm font-medium">التقييم</CardTitle>
              <Star class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                dir="ltr"
                class="text-2xl font-bold flex items-center gap-1 w-full justify-end"
              >
                {{ authStore.driver?.rate || 0.0 }}
                <Star class="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div class="p-6">
        <h2 class="text-2xl font-bold mb-4">الطلبات القريبة</h2>

        <div v-if="orders.length === 0" class="text-gray-400">
          لا توجد طلبات حالياً
        </div>

        <div v-else>
          <DriverOrders
            v-for="order in orders"
            :key="order.order_id"
            :order="order"
          />
        </div>
      </div>
    </TabsContent>
    <TabsContent value="order-history">
      <OrderHistory />
    </TabsContent>
  </Tabs>
</template>
