import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import {
  Building2,
  Palette,
  Image as ImageIcon,
  Save,
  X,
  Check,
  Upload,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

interface ClinicData {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  tagline: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

interface ClinicSettingsProps {
  clinicId: string;
  onClose: () => void;
  onSave?: () => void;
}

const COLOR_PRESETS = [
  { name: 'Blue', primary: '#0EA5E9', secondary: '#6366F1' },
  { name: 'Green', primary: '#10B981', secondary: '#14B8A6' },
  { name: 'Purple', primary: '#8B5CF6', secondary: '#A855F7' },
  { name: 'Red', primary: '#EF4444', secondary: '#F97316' },
  { name: 'Teal', primary: '#14B8A6', secondary: '#06B6D4' },
  { name: 'Indigo', primary: '#6366F1', secondary: '#8B5CF6' },
];

export default function ClinicSettings({ clinicId, onClose, onSave }: ClinicSettingsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [clinicData, setClinicData] = useState<ClinicData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0EA5E9');
  const [secondaryColor, setSecondaryColor] = useState('#6366F1');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const loadClinicData = useCallback(async () => {
    if (!supabase || !clinicId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();

      if (error) {
        console.error('Error loading clinic:', error);
        Alert.alert('Error', 'Failed to load clinic settings');
        return;
      }

      if (data) {
        setClinicData(data);
        setName(data.name || '');
        setTagline(data.tagline || '');
        setPrimaryColor(data.primary_color || '#0EA5E9');
        setSecondaryColor(data.secondary_color || '#6366F1');
        setLogoUrl(data.logo_url);
        setAddress(data.address || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
      }
    } catch (err) {
      console.error('Error loading clinic:', err);
    } finally {
      setIsLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    loadClinicData();
  }, [loadClinicData]);

  // Track changes
  useEffect(() => {
    if (!clinicData) return;

    const changed =
      name !== (clinicData.name || '') ||
      tagline !== (clinicData.tagline || '') ||
      primaryColor !== (clinicData.primary_color || '#0EA5E9') ||
      secondaryColor !== (clinicData.secondary_color || '#6366F1') ||
      logoUrl !== clinicData.logo_url ||
      address !== (clinicData.address || '') ||
      phone !== (clinicData.phone || '') ||
      email !== (clinicData.email || '');

    setHasChanges(changed);
  }, [name, tagline, primaryColor, secondaryColor, logoUrl, address, phone, email, clinicData]);

  const handlePickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload a logo.');
        return;
      }

      // Pick image with base64 encoding for mobile compatibility
      // Note: On iOS, base64: true is critical for reliable uploads
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7, // Slightly lower quality for faster upload
        base64: true, // Critical for iOS - ensures we get base64 data
        exif: false, // Don't need EXIF data, reduces payload
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];

      // Debug: Log what we received
      console.log('ImagePicker result:', {
        hasBase64: !!asset.base64,
        base64Length: asset.base64?.length || 0,
        uri: asset.uri?.substring(0, 50),
        width: asset.width,
        height: asset.height,
        mimeType: asset.mimeType,
      });

      await uploadLogo(asset);
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  /**
   * Decode base64 string to Uint8Array (cross-platform, works in React Native)
   */
  const base64ToUint8Array = (base64: string): Uint8Array => {
    // Base64 character set
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    // Remove padding and whitespace
    const cleanBase64 = base64.replace(/[\s=]/g, '');

    // Calculate output length
    const len = cleanBase64.length;
    const outputLen = Math.floor((len * 3) / 4);
    const bytes = new Uint8Array(outputLen);

    let p = 0;
    for (let i = 0; i < len; i += 4) {
      const c1 = chars.indexOf(cleanBase64[i]);
      const c2 = chars.indexOf(cleanBase64[i + 1]);
      const c3 = i + 2 < len ? chars.indexOf(cleanBase64[i + 2]) : 64;
      const c4 = i + 3 < len ? chars.indexOf(cleanBase64[i + 3]) : 64;

      bytes[p++] = (c1 << 2) | (c2 >> 4);
      if (c3 !== 64) {
        bytes[p++] = ((c2 & 15) << 4) | (c3 >> 2);
      }
      if (c4 !== 64) {
        bytes[p++] = ((c3 & 3) << 6) | c4;
      }
    }

    return bytes.slice(0, p);
  };

  const uploadLogo = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!supabase || !clinicId) return;

    setIsUploading(true);

    try {
      // Determine file extension from mimeType or URI
      let ext = 'jpg';
      if (asset.mimeType) {
        const mimeExt = asset.mimeType.split('/')[1];
        if (mimeExt && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(mimeExt.toLowerCase())) {
          ext = mimeExt.toLowerCase();
        }
      } else if (asset.uri) {
        const uriExt = asset.uri.split('.').pop()?.toLowerCase();
        if (uriExt && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(uriExt)) {
          ext = uriExt;
        }
      }

      // Normalize extensions
      if (ext === 'jpeg') ext = 'jpg';
      if (ext === 'heic') ext = 'jpg'; // HEIC gets converted by ImagePicker

      const fileName = `clinic-logos/${clinicId}/logo.${ext}`;
      const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

      console.log('Upload attempt:', {
        hasBase64: !!asset.base64,
        uri: asset.uri?.substring(0, 50),
        mimeType: asset.mimeType,
        platform: Platform.OS
      });

      let uploadData: Uint8Array | Blob;

      // Priority 1: Use base64 if available (most reliable on iOS/Android)
      if (asset.base64) {
        console.log('Using base64 data, length:', asset.base64.length);
        uploadData = base64ToUint8Array(asset.base64);
      }
      // Priority 2: Web platform - use fetch blob
      else if (Platform.OS === 'web') {
        console.log('Web platform: fetching blob');
        const response = await fetch(asset.uri);
        uploadData = await response.blob();
      }
      // Priority 3: iOS/Android - use XMLHttpRequest which handles local files better
      else {
        console.log('Mobile fallback: using XMLHttpRequest');
        uploadData = await new Promise<Uint8Array>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', asset.uri, true);
          xhr.responseType = 'arraybuffer';

          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 0) { // 0 for local files
              resolve(new Uint8Array(xhr.response));
            } else {
              reject(new Error(`XHR failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('XHR network error'));
          xhr.ontimeout = () => reject(new Error('XHR timeout'));
          xhr.timeout = 30000;
          xhr.send();
        });
      }

      console.log('Upload data ready, size:', uploadData instanceof Uint8Array ? uploadData.length : 'blob');

      // Upload to Supabase Storage (bucket: clinic-assets)
      const { data, error } = await supabase.storage
        .from('clinic-assets')
        .upload(fileName, uploadData, {
          contentType,
          upsert: true,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        Alert.alert('Upload Failed', error.message || 'Failed to upload logo. Please try again.');
        return;
      }

      console.log('Upload successful:', data);

      // Get public URL with cache busting
      const { data: urlData } = supabase.storage
        .from('clinic-assets')
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        // Add timestamp to bust cache
        setLogoUrl(`${urlData.publicUrl}?t=${Date.now()}`);
        Alert.alert('Success', 'Logo uploaded successfully!');
      }
    } catch (err) {
      console.error('Error uploading logo:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Upload Error', `Failed to upload logo: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    Alert.alert(
      'Remove Logo',
      'Are you sure you want to remove the clinic logo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => setLogoUrl(null) },
      ]
    );
  };

  const handleSave = async () => {
    if (!supabase || !clinicId) return;

    if (!name.trim()) {
      Alert.alert('Required', 'Clinic name is required');
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('clinics')
        .update({
          name: name.trim(),
          tagline: tagline.trim() || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          logo_url: logoUrl,
          address: address.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clinicId);

      if (error) {
        console.error('Save error:', error);
        Alert.alert('Error', 'Failed to save clinic settings');
        return;
      }

      Alert.alert('Success', 'Clinic settings saved successfully');
      setHasChanges(false);
      onSave?.();
    } catch (err) {
      console.error('Error saving clinic:', err);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading clinic settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={24} color={colors.neutral[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clinic Settings</Text>
        <TouchableOpacity
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Save size={18} color={hasChanges ? colors.white : colors.neutral[400]} />
              <Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>
                Save
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ImageIcon size={20} color={colors.primary[500]} />
            <Text style={styles.sectionTitle}>Clinic Logo</Text>
          </View>

          <View style={styles.logoContainer}>
            {logoUrl ? (
              <View style={styles.logoPreview}>
                <Image source={{ uri: logoUrl }} style={styles.logoImage} />
                <View style={styles.logoActions}>
                  <TouchableOpacity style={styles.logoActionButton} onPress={handlePickImage}>
                    <Upload size={16} color={colors.primary[500]} />
                    <Text style={styles.logoActionText}>Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.logoActionButton, styles.logoRemoveButton]}
                    onPress={handleRemoveLogo}
                  >
                    <X size={16} color={colors.error[500]} />
                    <Text style={[styles.logoActionText, styles.logoRemoveText]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.logoUploadButton} onPress={handlePickImage}>
                {isUploading ? (
                  <ActivityIndicator size="small" color={colors.primary[500]} />
                ) : (
                  <>
                    <Upload size={32} color={colors.neutral[400]} />
                    <Text style={styles.logoUploadText}>Upload Logo</Text>
                    <Text style={styles.logoUploadHint}>Square image recommended</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Basic Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Building2 size={20} color={colors.primary[500]} />
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Clinic Name *</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter clinic name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tagline</Text>
            <TextInput
              style={styles.textInput}
              value={tagline}
              onChangeText={setTagline}
              placeholder="e.g., Your Recovery Partner"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder="Clinic address"
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="(555) 123-4567"
                keyboardType="phone-pad"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="clinic@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* Brand Colors Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette size={20} color={colors.primary[500]} />
            <Text style={styles.sectionTitle}>Brand Colors</Text>
          </View>

          <Text style={styles.colorPresetsLabel}>Quick Presets</Text>
          <View style={styles.colorPresets}>
            {COLOR_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.name}
                style={styles.colorPreset}
                onPress={() => applyColorPreset(preset)}
              >
                <View style={styles.colorPresetSwatches}>
                  <View style={[styles.colorSwatch, { backgroundColor: preset.primary }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: preset.secondary }]} />
                </View>
                <Text style={styles.colorPresetName}>{preset.name}</Text>
                {primaryColor === preset.primary && secondaryColor === preset.secondary && (
                  <Check size={14} color={colors.success[500]} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.colorInputs}>
            <View style={styles.colorInputGroup}>
              <Text style={styles.inputLabel}>Primary Color</Text>
              <View style={styles.colorInputRow}>
                <View style={[styles.colorPreviewBox, { backgroundColor: primaryColor }]} />
                <TextInput
                  style={[styles.textInput, styles.colorInput]}
                  value={primaryColor}
                  onChangeText={setPrimaryColor}
                  placeholder="#0EA5E9"
                  autoCapitalize="characters"
                  maxLength={7}
                />
              </View>
            </View>

            <View style={styles.colorInputGroup}>
              <Text style={styles.inputLabel}>Secondary Color</Text>
              <View style={styles.colorInputRow}>
                <View style={[styles.colorPreviewBox, { backgroundColor: secondaryColor }]} />
                <TextInput
                  style={[styles.textInput, styles.colorInput]}
                  value={secondaryColor}
                  onChangeText={setSecondaryColor}
                  placeholder="#6366F1"
                  autoCapitalize="characters"
                  maxLength={7}
                />
              </View>
            </View>
          </View>

          {/* Preview */}
          <View style={styles.brandPreview}>
            <Text style={styles.brandPreviewLabel}>Preview</Text>
            <View style={[styles.brandPreviewHeader, { backgroundColor: primaryColor }]}>
              {logoUrl && <Image source={{ uri: logoUrl }} style={styles.brandPreviewLogo} />}
              <Text style={styles.brandPreviewName}>{name || 'Clinic Name'}</Text>
            </View>
            <TouchableOpacity style={[styles.brandPreviewButton, { backgroundColor: secondaryColor }]}>
              <Text style={styles.brandPreviewButtonText}>Sample Button</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.neutral[600],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.neutral[800],
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  saveButtonDisabled: {
    backgroundColor: colors.neutral[200],
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  saveButtonTextDisabled: {
    color: colors.neutral[400],
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.white,
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoPreview: {
    alignItems: 'center',
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
  },
  logoActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  logoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoRemoveButton: {},
  logoActionText: {
    fontSize: 14,
    color: colors.primary[500],
  },
  logoRemoveText: {
    color: colors.error[500],
  },
  logoUploadButton: {
    width: 150,
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[50],
  },
  logoUploadText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[600],
    marginTop: 8,
  },
  logoUploadHint: {
    fontSize: 12,
    color: colors.neutral[400],
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[700],
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: colors.neutral[50],
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  colorPresetsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[600],
    marginBottom: 8,
  },
  colorPresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  colorPreset: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    gap: 6,
  },
  colorPresetSwatches: {
    flexDirection: 'row',
    gap: 2,
  },
  colorSwatch: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  colorPresetName: {
    fontSize: 12,
    color: colors.neutral[700],
  },
  colorInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  colorInputGroup: {
    flex: 1,
  },
  colorInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorPreviewBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  colorInput: {
    flex: 1,
  },
  brandPreview: {
    marginTop: 20,
    padding: 16,
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
  },
  brandPreviewLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.neutral[500],
    marginBottom: 12,
    textAlign: 'center',
  },
  brandPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  brandPreviewLogo: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.white,
  },
  brandPreviewName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  brandPreviewButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  brandPreviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  bottomSpacer: {
    height: 32,
  },
});
