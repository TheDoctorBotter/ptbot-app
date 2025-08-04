import React from 'react';
import { Alert } from 'react-native';

interface RedFlagData {
  symptoms: string[];
  painLevel: number;
  location: string;
  timestamp: string;
}

export const sendRedFlagAlert = async (data: RedFlagData): Promise<boolean> => {
  try {
    // In a real application, this would be an API call to your backend
    const alertPayload = {
      to: 'ptbotai@gmail.com',
      subject: '🚨 PTBot Red Flag Alert - Immediate Attention Required',
      body: `
        RED FLAG ALERT - Patient Requires Immediate Medical Attention
        
        Timestamp: ${data.timestamp}
        Patient Location: ${data.location}
        Pain Level: ${data.painLevel}/10
        
        Red Flag Symptoms Reported:
        ${data.symptoms.map(symptom => `• ${symptom}`).join('\n')}
        
        RECOMMENDATION: This patient should be referred to appropriate medical specialist immediately.
        
        Please follow up as soon as possible.
        
        - PTBot Alert System
      `,
    };

    // Simulate API call
    console.log('Red Flag Alert Sent:', alertPayload);
    
    // In production, replace this with actual email API call:
    // const response = await fetch('/api/send-alert', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(alertPayload),
    // });
    
    return true;
  } catch (error) {
    console.error('Failed to send red flag alert:', error);
    return false;
  }
};

export const showRedFlagWarning = (symptoms: string[]) => {
  Alert.alert(
    '⚠️ Important Medical Alert',
    `You've indicated symptoms that may require immediate medical attention:\n\n${symptoms.map(s => `• ${s}`).join('\n')}\n\nA medical professional has been notified. Please consider seeking immediate medical care.`,
    [
      {
        text: 'I Understand',
        style: 'default',
      },
      {
        text: 'Find Emergency Care',
        style: 'destructive',
        onPress: () => {
          // In a real app, this could open maps to nearest emergency room
          Alert.alert('Emergency Care', 'Please contact 911 or visit your nearest emergency room if you experience severe symptoms.');
        },
      },
    ]
  );
};