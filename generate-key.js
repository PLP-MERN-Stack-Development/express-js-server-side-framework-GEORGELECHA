// import('uuid').v4 as uuidv4;
// // This script generates a unique API key using UUID and logs it to the console
// // You can use this key in your .env file for authentication purposes

// console.log('Generating a new API key...');

// // Generate a new UUID
// // This will be your API key
// // You can replace this with any other method of generating a key if needed
// // For example, you could use a random string generator or a secure hash function

// // Log the generated API key to the console
// // You can copy this key and add it to your .env file
// // Make sure to keep it secret and not expose it in public repositories
// console.log('=== YOUR API KEY ===');
// console.log(uuidv4());
// console.log('=== ADD THIS TO YOUR .env FILE ===');

// Use dynamic import for uuid
import('uuid').then(({ v4: uuidv4 }) => {
    console.log('=== YOUR API KEY ===');
    console.log(uuidv4());
    console.log('=== ADD THIS TO YOUR .env FILE ===');
});