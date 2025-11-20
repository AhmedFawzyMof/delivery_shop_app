<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { useAuthStore } from "@/stores/auth";

const id_number = ref("");
const password = ref("");
const shift = ref(8);
const imageBase64 = ref<string | null>(null);
const loading = ref(false);

const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  await authStore.checkSession();
  await authStore.checkRestaurantSession();

  if (authStore.isAuthenticated) {
    if (authStore.type === "driver") {
      router.push("/driver-panel");
    } else if (authStore.type === "restaurant") {
      router.push("/restaurant/dashboard");
    }
  }
});

async function handleLogin() {
  try {
    loading.value = true;

    // Take photo
    const photo = await Camera.getPhoto({
      quality: 40,
      resultType: CameraResultType.Uri,
      allowEditing: false,
      source: CameraSource.Camera,
      promptLabelHeader: "تأكيد الهوية بالسيلفي",
    });

    if (!photo.path) {
      alert("لازم تاخد سيلفي علشان تسجل الدخول.");
      return;
    }

    const response = await fetch(photo.webPath!);
    const selfieBlob = await response.blob();

    const formData = new FormData();
    formData.append("id_number", id_number.value);
    formData.append("password", password.value);
    formData.append("shift", shift.value.toString());
    formData.append("selfie", selfieBlob, "selfie.jpg");

    const success = await authStore.login(formData);

    if (success) {
      router.push("/driver-panel");
    } else {
      alert(authStore.error || "فشل تسجيل الدخول. تأكد من البيانات والسيلفي.");
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("حصل خطأ أثناء تسجيل الدخول، حاول تاني.");
  } finally {
    loading.value = false;
  }
}

function goToRegister() {
  router.push("/register");
}
</script>

<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 mt-2"
  >
    <router-link
      to="/landing"
      class="flex items-center gap-2 text-black mb-2 text-lg md:text-2xl absolute top-4 left-4 hover:underline"
    >
      <ArrowLeft class="w-4 h-4 md:w-6 md:h-6" />
      <p>الصفحة الرئيسية</p>
    </router-link>
    <router-link
      to="/restaurant"
      class="flex items-center gap-2 text-black mb-2 text-lg md:text-2xl absolute top-4 right-4 hover:underline"
    >
      <p>المطاعم</p>
      <ArrowRight class="w-4 h-4 md:w-6 md:h-6" />
    </router-link>
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-2xl font-bold">تسجيل الدخول الطيار</CardTitle>
        <CardDescription>
          اكتب بياناتك وخد سيلفي علشان تدخل على لوحة السواقين
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="grid gap-2">
            <Label for="id_number">رقم البطاقة</Label>
            <Input
              id="id_number"
              type="text"
              placeholder="اكتب رقم البطاقة"
              v-model="id_number"
              required
            />
          </div>

          <div class="grid gap-2">
            <Label for="shift">الوردية</Label>
            <Select v-model="shift">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="اختار الوردية" />
              </SelectTrigger>
              <SelectContent>
                <SelectLabel class="text-gray-400">الوردية</SelectLabel>
                <SelectItem :value="2">وردية ٢ ساعة</SelectItem>
                <SelectItem :value="4">وردية ٤ ساعات</SelectItem>
                <SelectItem :value="8">وردية ٨ ساعات</SelectItem>
                <SelectItem :value="12">وردية ١٢ ساعة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid gap-2">
            <Label for="password">كلمة السر</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              v-model="password"
              required
            />
          </div>

          <Button type="submit" class="w-full" :disabled="loading">
            <Loader v-if="loading" class="w-4 h-4 animate-spin" />
            <span>تسجيل الدخول</span>
          </Button>
        </form>

        <div v-if="imageBase64" class="mt-4 text-center">
          <p>الصورة اللي اتصورت:</p>
          <img
            :src="imageBase64"
            class="rounded-lg mt-2 w-40 h-40 mx-auto object-cover"
          />
        </div>

        <div class="mt-4 text-center text-sm">
          معندكش حساب؟
          <Button variant="link" @click="goToRegister" class="p-0 h-auto">
            سجل دلوقتي
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
