// Try it: add `| { kind: 'sms'; phoneNumber: string }` to ContactDetails.
// The assignment to `never` below reports an error until you handle it.
type ContactDetails =
  | { kind: 'email'; email: string }
  | { kind: 'phone'; phoneNumber: string }
  | { kind: 'both'; email: string; phoneNumber: string };

const describeContact = (contact: ContactDetails): string => {
  switch (contact.kind) {
    case 'email':
      return `Email: ${contact.email}`;
    case 'phone':
      return `Phone: ${contact.phoneNumber}`;
    case 'both':
      return `Email: ${contact.email}, phone: ${contact.phoneNumber}`;
    default: {
      const unreachable: never = contact;
      return unreachable;
    }
  }
};

console.log(describeContact({ kind: 'email', email: 'ada@example.com' }));
console.log(describeContact({ kind: 'phone', phoneNumber: '555-0100' }));
console.log(describeContact({ kind: 'both', email: 'ada@example.com', phoneNumber: '555-0100' }));
