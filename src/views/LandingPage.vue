<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, CircleDollarSign, Zap } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { Capacitor } from "@capacitor/core";

const router = useRouter();

function goToLogin() {
  router.push("/login");
}

function goToRegister() {
  router.push("/register");
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-red-600 text-white py-16 px-4 text-center">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-5xl font-extrabold tracking-tight mb-2">
          Delivery Shop
        </h1>
        <p>
          {{ Capacitor.getPlatform() }}
        </p>
        <p class="text-xl mb-6">Connect. Deliver. Earn.</p>
        <div class="flex items-center justify-center mb-8">
          <img src="/logo.webp" alt="Logo" class="rounded-full" />
        </div>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            @click="goToLogin"
            class="bg-white text-red-600 hover:bg-gray-100 text-lg px-8 py-4 rounded-full shadow-lg transition-all duration-300"
          >
            تسجيل دخول
          </Button>
          <Button
            @click="goToRegister"
            class="bg-transparent border-2 border-white hover:bg-white hover:text-red-600 text-lg px-8 py-4 rounded-full shadow-lg transition-all duration-300"
          >
            حساب جديد
          </Button>
        </div>
      </div>
    </div>

    <div class="py-16 px-4 max-w-6xl mx-auto">
      <h2 class="text-3xl font-bold text-gray-800 mb-8 text-center">
        صور من التطبيق
      </h2>
      <div class="grid grid-cols-3 md:grid-cols-3 gap-2">
        <Card class="shadow-lg rounded-xl overflow-hidden">
          <CardContent
            class="flex flex-col items-center justify-center h-64 p-4"
          >
            <img
              src="/phone-placeholder.svg"
              alt="Screenshot 1"
              class="h-40 w-auto mb-4"
            />
          </CardContent>
        </Card>
        <Card class="shadow-lg rounded-xl overflow-hidden">
          <CardContent
            class="flex flex-col items-center justify-center h-64 p-4"
          >
            <img
              src="/phone-placeholder.svg"
              alt="Screenshot 2"
              class="h-40 w-auto mb-4"
            />
          </CardContent>
        </Card>
        <Card class="shadow-lg rounded-xl overflow-hidden">
          <CardContent
            class="flex flex-col items-center justify-center h-64 p-4"
          >
            <img
              src="/phone-placeholder.svg"
              alt="Screenshot 3"
              class="h-40 w-auto mb-4"
            />
          </CardContent>
        </Card>
      </div>
    </div>

    <div class="bg-gray-100 py-16 px-4">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-3xl font-bold text-gray-800 mb-8 text-center">
          ليه تختار Delivery Shop?
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card class="shadow-lg rounded-xl p-6">
            <CardHeader class="flex flex-row items-center space-x-4 mb-4">
              <div class="bg-yellow-100 p-3 rounded-full">
                <Zap class="h-6 w-6 text-yellow-500" />
              </div>
              <CardTitle class="text-xl font-semibold">
                مطابقة فورية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-gray-600">بيتوصلك بالمطاعم في ثواني</p>
            </CardContent>
          </Card>

          <Card class="shadow-lg rounded-xl p-6">
            <CardHeader class="flex flex-row items-center space-x-4 mb-4">
              <div class="bg-green-100 p-3 rounded-full">
                <CircleDollarSign class="h-6 w-6 text-green-500" />
              </div>
              <CardTitle class="text-xl font-semibold"> كسب أكتر </CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-gray-600">نسبة كويسة وفلوسك بتوصلك على طول</p>
            </CardContent>
          </Card>

          <Card class="shadow-lg rounded-xl p-6">
            <CardHeader class="flex flex-row items-center space-x-4 mb-4">
              <div class="bg-blue-100 p-3 rounded-full">
                <ShieldCheck class="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle class="text-xl font-semibold">آمن ومضمون</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-gray-600">تتبع مباشر ودعم في أي وقت</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
