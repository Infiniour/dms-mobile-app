import { api } from '../../http';
import { createShowroomEndpoint } from './create-showroom.api';

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

function toNumber(value) {
  if (!hasValue(value)) {
    return undefined;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function normalizeGeolocation(geolocation = {}) {
  return {
    address: geolocation.address?.trim(),
    city: geolocation.city?.trim(),
    state: geolocation.state?.trim(),
    pincode: geolocation.pincode?.trim(),
    lat: toNumber(geolocation.lat),
    lng: toNumber(geolocation.lng),
  };
}

function hasGeolocation(geolocation) {
  return Object.values(geolocation).some(hasValue);
}

function extensionFromImage(image) {
  const source = image?.name || image?.uri || '';
  const extension = source.split('.').pop()?.toLowerCase();

  if (extension === 'jpg' || extension === 'jpeg' || extension === 'png') {
    return extension;
  }

  return 'jpg';
}

function mimeTypeFromImage(image) {
  if (image?.type) {
    return image.type;
  }

  const extension = extensionFromImage(image);
  return extension === 'png' ? 'image/png' : 'image/jpeg';
}

function appendImage(formData, fieldName, image) {
  if (!image?.uri) {
    return;
  }

  const extension = extensionFromImage(image);

  formData.append(fieldName, {
    uri: image.uri,
    name: image.name || `${fieldName}.${extension}`,
    type: mimeTypeFromImage(image),
  });
}

export function createShowroom({ name, geolocation, logo, banner }) {
  const formData = new FormData();
  const nextGeolocation = normalizeGeolocation(geolocation);

  formData.append('name', name.trim());

  if (hasGeolocation(nextGeolocation)) {
    formData.append('geolocation', JSON.stringify(nextGeolocation));
  }

  appendImage(formData, 'showroom_logo', logo);
  appendImage(formData, 'showroom_banner', banner);

  return api.post(createShowroomEndpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
