<script setup lang="ts">
import { ref } from "vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const isOnline = ref(true);
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <!-- Header -->
    <div
      class="flex items-center justify-between bg-white p-4 rounded-lg shadow mb-4"
    >
      <div class="flex items-center space-x-3">
        <div class="bg-orange-500 p-2 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 17l-4-4m0 0l4-4m-4 4h12a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2z"
            />
          </svg>
        </div>
        <div>
          <h1 class="text-lg font-semibold">Ahmed Ali</h1>
          <p class="text-sm text-gray-500">Driver Panel</p>
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-green-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div class="flex items-center space-x-2">
          <Label for="online-mode">Online</Label>
          <Switch id="online-mode" v-model:checked="isOnline" />
        </div>
        <div
          class="bg-gray-200 h-8 w-8 flex items-center justify-center rounded-full text-gray-700 font-semibold"
        >
          A
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Today's Earnings Card -->
      <Card class="shadow-md">
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium"> Today's Earnings </CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">$0.00</div>
          <p class="text-xs text-gray-500">From 0 deliveries</p>
        </CardContent>
      </Card>

      <!-- Deliveries Card -->
      <Card class="shadow-md">
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium"> Deliveries </CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">0</div>
          <p class="text-xs text-gray-500">Completed today</p>
        </CardContent>
      </Card>

      <!-- Rating Card -->
      <Card class="shadow-md">
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium"> Rating </CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.329 1.176l1.519 4.674c.3.921-.755 1.688-1.539 1.175l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.513-1.838-.254-1.539-1.175l1.519-4.674a1 1 0 00-.329-1.176l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.519-4.674z"
            />
          </svg>
        </CardHeader>
        <CardContent>
          <div class="flex items-center text-2xl font-bold">
            4.8
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-yellow-400 ml-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.329 1.176l1.07 3.292c.3.921-.755 1.688-1.539 1.175l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.513-1.838-.254-1.539-1.175l1.07-3.292a1 1 0 00-.329-1.176l-2.8-2.034c-.784-.57-.382-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"
              />
            </svg>
          </div>
          <p class="text-xs text-gray-500">Based on 156 reviews</p>
        </CardContent>
      </Card>

      <!-- Active Delivery Card -->
      <Card class="lg:col-span-3 bg-orange-50 border-orange-200 shadow-md">
        <CardHeader>
          <CardTitle class="text-orange-600 flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 7l-6 6m0 0l6 6m-6-6h10a2 2 0 002-2V8a2 2 0 00-2-2H7"
              />
            </svg>
            <span>Active Delivery - #1234</span>
          </CardTitle>
          <p class="text-sm text-gray-600">Current delivery in progress</p>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <p class="font-semibold">Pickup Location</p>
            <p>Pizza Palace</p>
            <p class="text-sm text-gray-600">123 Downtown St, Cairo</p>
          </div>
          <div>
            <p class="font-semibold">Delivery Location</p>
            <p>Sara Mohamed</p>
            <p class="text-sm text-gray-600">456 Main St, Giza</p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<style scoped>
/* Add any specific styles here if needed */
</style>
