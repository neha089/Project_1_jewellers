// SMS/WhatsApp Service Integration
// Replace these with your actual API credentials and endpoints

const SMS_CONFIG = {
  // Example for Twilio
  twilio: {
    accountSid: 'YOUR_TWILIO_ACCOUNT_SID',
    authToken: 'YOUR_TWILIO_AUTH_TOKEN',
    fromNumber: 'YOUR_TWILIO_PHONE_NUMBER'
  },
  
  // Example for TextLocal (Popular in India)
  textlocal: {
    apiKey: 'YOUR_TEXTLOCAL_API_KEY',
    sender: 'YOUR_SENDER_ID'
  },
  
  // Example for MSG91 (Popular in India)
  msg91: {
    authKey: 'YOUR_MSG91_AUTH_KEY',
    templateId: 'YOUR_TEMPLATE_ID',
    sender: 'YOUR_SENDER_ID'
  }
};

// WhatsApp Business API Configuration
const WHATSAPP_CONFIG = {
  // Example for WhatsApp Business API
  businessApiUrl: 'https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages',
  accessToken: 'YOUR_WHATSAPP_ACCESS_TOKEN',
  
  // Or for third-party services like Gupshup, Interakt, etc.
  gupshup: {
    apiUrl: 'https://api.gupshup.io/sm/api/v1/msg',
    apiKey: 'YOUR_GUPSHUP_API_KEY',
    source: 'YOUR_SOURCE_NUMBER'
  }
};

// Message templates
const MESSAGE_TEMPLATES = {
  paymentReminder: {
    sms: (customerName, amount, businessName = 'JewelryPro') => 
      `Dear ${customerName}, this is a friendly reminder that you have a pending balance of ₹${amount.toLocaleString()} with ${businessName}. Please contact us to arrange payment. Thank you!`,
    
    whatsapp: (customerName, amount, businessName = 'JewelryPro') => 
      `🙏 Dear ${customerName},\n\nThis is a friendly reminder from ${businessName}.\n\n💰 Pending Balance: ₹${amount.toLocaleString()}\n\nPlease contact us to arrange payment at your convenience.\n\nThank you for your business! 🙏`,
    
    formal: (customerName, amount, businessName = 'JewelryPro', dueDate) =>
      `Dear ${customerName},\n\nWe hope this message finds you well. This is to inform you that you have an outstanding balance of ₹${amount.toLocaleString()} with ${businessName}${dueDate ? ` due on ${dueDate}` : ''}.\n\nKindly arrange for payment at your earliest convenience.\n\nFor any queries, please feel free to contact us.\n\nThank you,\n${businessName} Team`
  },
  
  paymentReceived: {
    sms: (customerName, amount, remainingBalance, businessName = 'JewelryPro') =>
      `Dear ${customerName}, we have received your payment of ₹${amount.toLocaleString()}. ${remainingBalance > 0 ? `Remaining balance: ₹${remainingBalance.toLocaleString()}` : 'Your account is now settled.'} Thank you! - ${businessName}`,
    
    whatsapp: (customerName, amount, remainingBalance, businessName = 'JewelryPro') =>
      `✅ Payment Received!\n\nDear ${customerName},\n\n💰 Amount Received: ₹${amount.toLocaleString()}\n${remainingBalance > 0 ? `📊 Remaining Balance: ₹${remainingBalance.toLocaleString()}` : '🎉 Account Settled!'}\n\nThank you for your payment!\n\n- ${businessName} Team`
  }
};

// SMS Service Functions
export const sendSMS = async (phoneNumber, message, service = 'textlocal') => {
  try {
    // Format phone number (ensure it starts with country code)
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    switch (service) {
      case 'twilio':
        return await sendTwilioSMS(formattedPhone, message);
      case 'textlocal':
        return await sendTextLocalSMS(formattedPhone, message);
      case 'msg91':
        return await sendMSG91SMS(formattedPhone, message);
      default:
        throw new Error('Unsupported SMS service');
    }
  } catch (error) {
    console.error('SMS sending failed:', error);
    return { success: false, error: error.message };
  }
};

// WhatsApp Service Functions
export const sendWhatsAppMessage = async (phoneNumber, message, service = 'gupshup') => {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    switch (service) {
      case 'business_api':
        return await sendWhatsAppBusinessAPI(formattedPhone, message);
      case 'gupshup':
        return await sendGupshupWhatsApp(formattedPhone, message);
      default:
        throw new Error('Unsupported WhatsApp service');
    }
  } catch (error) {
    console.error('WhatsApp sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Individual SMS Service Implementations
const sendTwilioSMS = async (phoneNumber, message) => {
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SMS_CONFIG.twilio.accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${SMS_CONFIG.twilio.accountSid}:${SMS_CONFIG.twilio.authToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'To': phoneNumber,
      'From': SMS_CONFIG.twilio.fromNumber,
      'Body': message
    })
  });
  
  if (response.ok) {
    const data = await response.json();
    return { success: true, messageId: data.sid };
  } else {
    const error = await response.text();
    throw new Error(`Twilio error: ${error}`);
  }
};

const sendTextLocalSMS = async (phoneNumber, message) => {
  const response = await fetch('https://api.textlocal.in/send/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'apikey': SMS_CONFIG.textlocal.apiKey,
      'numbers': phoneNumber.replace('+', ''),
      'message': message,
      'sender': SMS_CONFIG.textlocal.sender
    })
  });
  
  const data = await response.json();
  if (data.status === 'success') {
    return { success: true, messageId: data.messages[0].id };
  } else {
    throw new Error(`TextLocal error: ${data.errors[0].message}`);
  }
};

const sendMSG91SMS = async (phoneNumber, message) => {
  const response = await fetch(`https://api.msg91.com/api/v5/flow/`, {
    method: 'POST',
    headers: {
      'authkey': SMS_CONFIG.msg91.authKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'template_id': SMS_CONFIG.msg91.templateId,
      'sender': SMS_CONFIG.msg91.sender,
      'short_url': '0',
      'mobiles': phoneNumber.replace('+', ''),
      'var1': message
    })
  });
  
  const data = await response.json();
  if (data.type === 'success') {
    return { success: true, messageId: data.request_id };
  } else {
    throw new Error(`MSG91 error: ${data.message}`);
  }
};

// WhatsApp Service Implementations
const sendWhatsAppBusinessAPI = async (phoneNumber, message) => {
  const response = await fetch(WHATSAPP_CONFIG.businessApiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phoneNumber.replace('+', ''),
      type: 'text',
      text: {
        body: message
      }
    })
  });
  
  const data = await response.json();
  if (response.ok) {
    return { success: true, messageId: data.messages[0].id };
  } else {
    throw new Error(`WhatsApp Business API error: ${data.error.message}`);
  }
};

const sendGupshupWhatsApp = async (phoneNumber, message) => {
  const response = await fetch(WHATSAPP_CONFIG.gupshup.apiUrl, {
    method: 'POST',
    headers: {
      'apikey': WHATSAPP_CONFIG.gupshup.apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'channel': 'whatsapp',
      'source': WHATSAPP_CONFIG.gupshup.source,
      'destination': phoneNumber.replace('+', ''),
      'message': JSON.stringify({
        type: 'text',
        text: message
      })
    })
  });
  
  const data = await response.json();
  if (data.status === 'submitted') {
    return { success: true, messageId: data.messageId };
  } else {
    throw new Error(`Gupshup error: ${data.message}`);
  }
};

// Utility Functions
const formatPhoneNumber = (phoneNumber) => {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Add country code if missing (assuming India +91)
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  
  return '+' + cleaned;
};

// High-level functions for your application
export const sendPaymentReminder = async (customerName, phoneNumber, amount, method = 'sms', template = 'sms') => {
  const message = MESSAGE_TEMPLATES.paymentReminder[template](customerName, amount);
  
  if (method === 'sms') {
    return await sendSMS(phoneNumber, message);
  } else if (method === 'whatsapp') {
    return await sendWhatsAppMessage(phoneNumber, message);
  } else {
    throw new Error('Unsupported messaging method');
  }
};

export const sendPaymentConfirmation = async (customerName, phoneNumber, amount, remainingBalance, method = 'sms') => {
  const template = method === 'whatsapp' ? 'whatsapp' : 'sms';
  const message = MESSAGE_TEMPLATES.paymentReceived[template](customerName, amount, remainingBalance);
  
  if (method === 'sms') {
    return await sendSMS(phoneNumber, message);
  } else if (method === 'whatsapp') {
    return await sendWhatsAppMessage(phoneNumber, message);
  } else {
    throw new Error('Unsupported messaging method');
  }
};

// For development/testing - Mock implementation
export const sendReminderMock = (customerPhone, amount, customerName) => {
  const message = MESSAGE_TEMPLATES.paymentReminder.sms(customerName, amount);
  
  console.log(`📱 SMS would be sent to: ${customerPhone}`);
  console.log(`💬 Message: ${message}`);
  
  // Simulate API call delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Show alert for demo purposes
      alert(`Message sent to ${customerName} (${customerPhone}):\n\n${message}`);
      resolve({ success: true, messageId: 'mock_' + Date.now() });
    }, 1000);
  });
};

export default {
  sendSMS,
  sendWhatsAppMessage,
  sendPaymentReminder,
  sendPaymentConfirmation,
  sendReminderMock,
  MESSAGE_TEMPLATES
};