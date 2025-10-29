<script setup lang="ts">
import { ref } from "vue";
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
import { useRouter } from "vue-router";
import { Camera, CameraResultType } from "@capacitor/camera";
import { httpRequest } from "@/utils/http";

const id_number = ref("");
const shift = ref("");
const password = ref("");
const imageBase64 = ref<string | null>(null);
const isLoading = ref(false);
const router = useRouter();

async function handleLogin() {
  try {
    isLoading.value = true;

    const photo = await Camera.getPhoto({
      quality: 70,
      resultType: CameraResultType.Base64,
      allowEditing: false,
      promptLabelHeader: "تأكيد الهوية بالسيلفي",
      promptLabelPhoto: "خد سيلفي",
    });

    if (!photo.base64String) {
      throw new Error("الصورة ما اتاخدتش.");
    }

    imageBase64.value = `data:image/jpeg;base64,${photo.base64String}`;

    const formData = new FormData();
    formData.append("id_number", id_number.value);
    formData.append("password", password.value);
    formData.append("shift", shift.value.toString());
    formData.append(
      "selfie",
      base64ToBlob(photo.base64String as string),
      "selfie.jpg"
    );

    await httpRequest<{ message: string }>({
      url: "/api/auth/login",
      method: "POST",
      data: formData,
    });

    router.push("/driver-panel");
  } catch (err) {
    console.error("Login error:", err);
    alert("فشل تسجيل الدخول أو السيلفي ما اتاخدتش، حاول تاني.");
  } finally {
    isLoading.value = false;
  }
}

function base64ToBlob(base64Data: string) {
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: "image/jpeg" });
}

function goToRegister() {
  router.push("/register");
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-2xl font-bold">تسجيل الدخول</CardTitle>
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

          <Button type="submit" class="w-full" :disabled="isLoading">
            {{ isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول" }}
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
