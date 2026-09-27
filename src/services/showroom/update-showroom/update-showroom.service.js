import { api } from '../../http';
import { updateShowroomEndpoint } from './update-showroom.api';

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

export function updateShowroom({
  showroomId,
  name,
  geolocation,
  logo,
  banner,
  removeLogo,
  removeBanner,
}) {
  const endpoint = updateShowroomEndpoint.replace(':id', String(showroomId));
  const formData = new FormData();

  if (hasValue(name)) {
    formData.append('name', name.trim());
  }

  if (geolocation) {
    const nextGeolocation = normalizeGeolocation(geolocation);

    if (hasGeolocation(nextGeolocation)) {
      formData.append('geolocation', JSON.stringify(nextGeolocation));
    }
  }

  if (logo?.uri) {
    appendImage(formData, 'showroom_logo', logo);
  } else if (removeLogo) {
    formData.append('remove_logo', 'true');
  }

  if (banner?.uri) {
    appendImage(formData, 'showroom_banner', banner);
  } else if (removeBanner) {
    formData.append('remove_banner', 'true');
  }

  return api.patch(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
