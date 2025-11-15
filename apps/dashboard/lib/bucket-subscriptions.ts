export const bucketSubscriptions = [
  {
    type: "small",
    label: "Small",
    description: "Bucket for small teams",
    capacity: 10,
    maxFileSize: 5,
  },
  {
    type: "medium",
    label: "Medium",
    description: "Bucket for medium teams",
    capacity: 100,
    maxFileSize: 20,
  },
  {
    type: "large",
    label: "Large",
    description: "Bucket for large teams",
    capacity: 1000,
    maxFileSize: 100,
  },
  {
    type: "org",
    label: "Enterprise",
    description: "Basically unlimited",
    capacity: 10000,
    maxFileSize: 1000,
  },
];
