type ContactDetails =
  | { kind: 'email'; email: string }
  | { kind: 'phone'; phoneNumber: string }
  | { kind: 'both'; email: string; phoneNumber: string };

// Pick one of the three cases and give it the fields it requires.
const contact: ContactDetails = {};

console.log(contact);
