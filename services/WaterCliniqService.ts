import { Alert, Linking } from 'react-native';

export interface WaterCliniqContact {
  name: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  website?: string;
}

// Real water clinic contacts - can be customized per region
// Only include actual Water Cliniq Labs, not government offices or health departments
const WATER_CLINIQS: WaterCliniqContact[] = [
  {
    name: 'Water Cliniq Lab',
    phone: '+237 6XX XXX XXX',
    email: 'lab@watercliniq.cm',
    whatsapp: '+237 6XX XXX XXX',
    address: 'Douala, Cameroon',
    website: 'https://watercliniq.cm',
  },
];

class WaterCliniqService {
  getClinicContacts(): WaterCliniqContact[] {
    return WATER_CLINIQS;
  }

  async callClinic(phone: string) {
    try {
      const phoneNumber = phone.replace(/\s/g, '');
      const url = `tel:${phoneNumber}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot make phone calls on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open phone dialer');
      console.error('Call error:', error);
    }
  }

  async emailClinic(email: string, subject?: string, body?: string) {
    try {
      const emailSubject = subject || 'Water Quality Analysis Request';
      const emailBody = body || 'I would like to request a professional water quality analysis.';
      const url = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No email client available');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open email client');
      console.error('Email error:', error);
    }
  }

  async openWhatsApp(phone: string, message?: string) {
    try {
      const phoneNumber = phone.replace(/\s/g, '').replace(/\+/g, '');
      const defaultMessage = 'Hello, I would like to request a professional water quality analysis.';
      const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message || defaultMessage)}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open WhatsApp');
      console.error('WhatsApp error:', error);
    }
  }

  async openWebsite(url: string) {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open website');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open website');
      console.error('Website error:', error);
    }
  }

  showContactOptions(clinic: WaterCliniqContact) {
    const options: string[] = [];
    const actions: (() => void)[] = [];

    if (clinic.phone) {
      options.push(`Call ${clinic.phone}`);
      actions.push(() => this.callClinic(clinic.phone!));
    }

    if (clinic.whatsapp) {
      options.push(`WhatsApp ${clinic.whatsapp}`);
      actions.push(() => this.openWhatsApp(clinic.whatsapp!));
    }

    if (clinic.email) {
      options.push(`Email ${clinic.email}`);
      actions.push(() => this.emailClinic(clinic.email!));
    }

    if (clinic.website) {
      options.push('Visit Website');
      actions.push(() => this.openWebsite(clinic.website!));
    }

    if (options.length === 0) {
      Alert.alert('No Contact Information', 'Contact details are not available for this clinic.');
      return;
    }

    Alert.alert(
      `Contact ${clinic.name}`,
      'Choose how you would like to contact the water clinic:',
      [
        ...options.map((option, index) => ({
          text: option,
          onPress: actions[index],
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }
}

export default new WaterCliniqService();
