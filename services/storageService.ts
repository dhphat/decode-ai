import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export const uploadImageToFirebase = async (base64Image: string): Promise<string> => {
    // Generate a unique filename
    const filename = `decoded-${Date.now()}.png`;
    const storageRef = ref(storage, `images/${filename}`);

    // Upload the base64 string
    // Format: data:image/png;base64,....
    const result = await uploadString(storageRef, base64Image, 'data_url');

    // Get the public URL
    const downloadURL = await getDownloadURL(result.ref);
    return downloadURL;
};
