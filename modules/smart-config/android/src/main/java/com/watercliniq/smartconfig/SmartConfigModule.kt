/**
 * Android SmartConfig Module
 *
 * Implements ESP-Touch v2 protocol for Tuya device pairing.
 *
 * Build with: expo run:android
 * This module requires expo-dev-client and expo-modules-core.
 *
 * The module uses Android's DatagramSocket to broadcast encoded UDP packets
 * following the ESP-Touch protocol specification.
 */

package com.watercliniq.smartconfig;

import android.content.Context;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;

import expo.modules.kotlin.modules.Module;
import expo.modules.kotlin.modules.ModuleDefinition;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.util.concurrent.CompletableFuture;

public class SmartConfigModule extends Module {

  private volatile boolean isRunning = false;
  private static final int ESP_TOUCH_PORT = 7001;
  private static final int BROADCAST_PORT = 18266;
  private static final String BROADCAST_IP = "255.255.255.255";

  @Override
  public void definition(ModuleDefinition definition) {
    definition.setName("SmartConfigModule");

    definition.function("startConfig", (String ssid, String password) -> {
      return startESPToach(ssid, password);
    });

    definition.function("stopConfig", () -> {
      isRunning = false;
    });

    definition.function("isSupported", () -> {
      return true;
    });
  }

  /**
   * ESP-Touch v2 SmartConfig implementation
   *
   * Encodes WiFi SSID and password into UDP packet lengths and IP addresses,
   * then broadcasts them. The device in promiscuous mode captures these packets
   * and decodes the credentials.
   */
  private CompletableFuture<String> startESPToach(String ssid, String password) {
    CompletableFuture<String> future = new CompletableFuture<>();
    isRunning = true;

    new Thread(() -> {
      try {
        DatagramSocket socket = new DatagramSocket();
        socket.setBroadcast(true);
        InetAddress broadcastAddr = InetAddress.getByName(BROADCAST_IP);

        // Encode: total length header first, then SSID, then password
        byte[] totalData = (ssid + "\0" + password).getBytes("UTF-8");
        byte[] ssidBytes = ssid.getBytes("UTF-8");
        byte[] pwdBytes = password.getBytes("UTF-8");

        // ESP-Touch encoding: each byte is encoded as a sequence of UDP packets
        // where the packet length represents the byte value
        for (int round = 0; round < 3 && isRunning; round++) {
          // Send length header
          sendEncodedByte(socket, broadcastAddr, totalData.length);
          Thread.sleep(10);

          // Send SSID
          for (byte b : ssidBytes) {
            if (!isRunning) break;
            sendEncodedByte(socket, broadcastAddr, b & 0xFF);
            Thread.sleep(5);
          }

          // Null separator
          sendEncodedByte(socket, broadcastAddr, 0);

          // Send password
          for (byte b : pwdBytes) {
            if (!isRunning) break;
            sendEncodedByte(socket, broadcastAddr, b & 0xFF);
            Thread.sleep(5);
          }
        }

        socket.close();

        // Wait for device to connect to WiFi
        Thread.sleep(5000);

        // Return success - the actual device discovery happens via Tuya Cloud API
        future.complete("{\"status\":\"sent\",\"message\":\"SmartConfig broadcast complete\"}");
      } catch (Exception e) {
        future.completeExceptionally(e);
      }
    }).start();

    return future;
  }

  private void sendEncodedByte(DatagramSocket socket, InetAddress addr, int value) throws Exception {
    // Encode byte value into packet length
    // ESP-Touch uses packet length as the data carrier
    int packetLength = 10 + value;
    byte[] data = new byte[packetLength];
    data[0] = (byte) 0x01; // ESP-Touch magic byte

    DatagramPacket packet = new DatagramPacket(data, packetLength, addr, ESP_TOUCH_PORT);
    socket.send(packet);

    // Also send on alternate port
    packet.setPort(BROADCAST_PORT);
    socket.send(packet);

    // Small delay between packets
    Thread.sleep(2);
  }

  private Context getContext() {
    return getAppContext().getApplicationContext();
  }
}
