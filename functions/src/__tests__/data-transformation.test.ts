// Test file for data transformation functions
import * as admin from "firebase-admin";

// Mock Firebase Admin for testing
jest.mock("firebase-admin", () => ({
  firestore: {
    Timestamp: {
      now: jest.fn(() => ({
        toDate: jest.fn(() => new Date("2024-01-15T10:30:00.000Z")),
      })),
    },
    GeoPoint: jest.fn((lat: number, lng: number) => ({
      latitude: lat,
      longitude: lng,
    })),
    DocumentReference: jest.fn((path: string) => ({
      path,
      id: path.split("/").pop(),
    })),
  },
}));

// Import the transformation function (we'll need to extract it for testing)
function transformFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Firestore Timestamps
  if (data && typeof data.toDate === "function") {
    return data.toDate();
  }

  // Handle Firestore References
  if (data && data.path && data.id) {
    return {
      _type: "reference",
      _path: data.path,
      _id: data.id,
    };
  }

  // Handle Firestore GeoPoints
  if (data && typeof data.latitude === "number" && typeof data.longitude === "number") {
    return {
      type: "Point",
      coordinates: [data.longitude, data.latitude],
    };
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map(transformFirestoreData);
  }

  // Handle Objects
  if (typeof data === "object") {
    const transformed: any = {};
    for (const [key, value] of Object.entries(data)) {
      transformed[key] = transformFirestoreData(value);
    }
    return transformed;
  }

  // Return primitives as-is
  return data;
}

describe("Data Transformation", () => {
  describe("transformFirestoreData", () => {
    it("should handle null and undefined values", () => {
      expect(transformFirestoreData(null)).toBeNull();
      expect(transformFirestoreData(undefined)).toBeUndefined();
    });

    it("should transform Firestore Timestamps to Date objects", () => {
      const mockTimestamp = {
        toDate: jest.fn(() => new Date("2024-01-15T10:30:00.000Z")),
      };

      const result = transformFirestoreData(mockTimestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe("2024-01-15T10:30:00.000Z");
    });

    it("should transform Firestore References to structured objects", () => {
      const mockReference = {
        path: "users/123",
        id: "123",
      };

      const result = transformFirestoreData(mockReference);
      expect(result).toEqual({
        _type: "reference",
        _path: "users/123",
        _id: "123",
      });
    });

    it("should transform Firestore GeoPoints to GeoJSON", () => {
      const mockGeoPoint = {
        latitude: 37.7749,
        longitude: -122.4194,
      };

      const result = transformFirestoreData(mockGeoPoint);
      expect(result).toEqual({
        type: "Point",
        coordinates: [-122.4194, 37.7749],
      });
    });

    it("should handle arrays recursively", () => {
      const mockData = [
        {
          name: "John",
          createdAt: {
            toDate: jest.fn(() => new Date("2024-01-15T10:30:00.000Z")),
          },
        },
        {
          name: "Jane",
          location: {
            latitude: 37.7749,
            longitude: -122.4194,
          },
        },
      ];

      const result = transformFirestoreData(mockData);
      expect(result).toHaveLength(2);
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[1].location.type).toBe("Point");
    });

    it("should handle nested objects recursively", () => {
      const mockData = {
        user: {
          name: "John",
          profile: {
            createdAt: {
              toDate: jest.fn(() => new Date("2024-01-15T10:30:00.000Z")),
            },
            location: {
              latitude: 37.7749,
              longitude: -122.4194,
            },
          },
        },
      };

      const result = transformFirestoreData(mockData);
      expect(result.user.profile.createdAt).toBeInstanceOf(Date);
      expect(result.user.profile.location.type).toBe("Point");
    });

    it("should preserve primitive values", () => {
      expect(transformFirestoreData("string")).toBe("string");
      expect(transformFirestoreData(123)).toBe(123);
      expect(transformFirestoreData(true)).toBe(true);
      expect(transformFirestoreData(false)).toBe(false);
    });

    it("should handle complex nested structures", () => {
      const mockData = {
        users: [
          {
            id: "user1",
            name: "John",
            metadata: {
              createdAt: {
                toDate: jest.fn(() => new Date("2024-01-15T10:30:00.000Z")),
              },
              references: [
                {
                  path: "categories/tech",
                  id: "tech",
                },
                {
                  path: "categories/business",
                  id: "business",
                },
              ],
              location: {
                latitude: 37.7749,
                longitude: -122.4194,
              },
            },
          },
        ],
      };

      const result = transformFirestoreData(mockData);
      
      expect(result.users[0].metadata.createdAt).toBeInstanceOf(Date);
      expect(result.users[0].metadata.references).toHaveLength(2);
      expect(result.users[0].metadata.references[0]._type).toBe("reference");
      expect(result.users[0].metadata.location.type).toBe("Point");
    });
  });
}); 