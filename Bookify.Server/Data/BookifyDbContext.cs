using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Bookify.Server.Data
{
    public class BookifyDbContext : DbContext
    {
        public BookifyDbContext(DbContextOptions<BookifyDbContext> options)
            : base(options)
        {
        }

        // Add your tables here
        public DbSet<User> Users { get; set; }
        public DbSet<Hotel> Hotels { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<Reservation> Reservations { get; set; }
        public DbSet<Payment> Payments { get; set; } // 
        // public DbSet<Book> Books { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // It's good practice to call the base version of this method first,
            // especially if you are using ASP.NET Core Identity which does its own configurations here.
            base.OnModelCreating(modelBuilder);

            // --- Configure Relationships and Cascade Delete Behavior ---

            // Relationship: User <-> Reservation
            // A User can have many Reservations. A Reservation belongs to one User.
            modelBuilder.Entity<Reservation>()
                .HasOne(r => r.User)             // Reservation has one User
                .WithMany(u => u.Reservations)   // User has many Reservations (using the navigation property)
                .HasForeignKey(r => r.UserId)    // The foreign key in the Reservation table is UserId
                .OnDelete(DeleteBehavior.Restrict); // << KEY FIX FOR YOUR ERROR!
                                                    // This tells SQL Server: DO NOT delete a User if they have
                                                    // associated Reservations. If you try, SQL Server will give an error.
                                                    // This breaks one of the multiple cascade paths to the Payment table.

            // Relationship: User <-> Payment
            // A User can have many Payments. A Payment is made by one User.
            modelBuilder.Entity<Payment>()
                .HasOne(p => p.User)             // Payment has one User
                .WithMany(u => u.Payments)       // User has many Payments
                .HasForeignKey(p => p.UserId)    // Foreign key in Payment is UserId
                .OnDelete(DeleteBehavior.Restrict); // Let's also restrict deleting a User if they have direct Payments.
                                                    // This means if a user has made any payments (even those not tied to a
                                                    // reservation that would be caught by the rule above), they can't be
                                                    // deleted until those payments are disassociated or handled.
                                                    // If you set this to Cascade, and the User->Reservation was also Cascade,
                                                    // you'd have the multiple path issue.
                                                    // Setting this to Restrict simplifies things: a User cannot be deleted if
                                                    // they have active Reservations OR active Payments.

            // Relationship: Hotel <-> Room
            // A Hotel can have many Rooms. A Room belongs to one Hotel.
            modelBuilder.Entity<Room>()
                .HasOne(r => r.Hotel)            // Room has one Hotel
                .WithMany(h => h.Rooms)          // Hotel has many Rooms
                .HasForeignKey(r => r.HotelId)   // Foreign key in Room is HotelId
                .OnDelete(DeleteBehavior.Cascade); // If a Hotel is deleted, all its Rooms are also deleted.
                                                   // This is generally expected behavior.

            // Relationship: Room <-> Reservation
            // A Room can have many Reservations. A Reservation is for one Room.
            modelBuilder.Entity<Reservation>()
                .HasOne(r => r.Room)             // Reservation has one Room
                .WithMany(rm => rm.Reservations) // Room has many Reservations
                .HasForeignKey(r => r.RoomId)    // Foreign key in Reservation is RoomId
                .OnDelete(DeleteBehavior.Cascade); // If a Room is deleted (e.g., no longer available),
                                                   // its Reservations are also typically deleted or should be invalidated.

            // Relationship: Reservation <-> Payment
            // A Reservation can have many Payments (e.g., deposit, full payment). A Payment belongs to one Reservation.
            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Reservation)       // Payment has one Reservation
                .WithMany(r => r.Payments)        // Reservation has many Payments
                .HasForeignKey(p => p.ReservationId) // Foreign key in Payment is ReservationId
                .OnDelete(DeleteBehavior.Cascade);  // If a Reservation is deleted, all associated Payments are deleted.
                                                    // This is logical.

            // --- Configure Decimal Precision (to fix the warnings) ---
            modelBuilder.Entity<Room>()
                .Property(r => r.Price)
                .HasColumnType("decimal(18, 2)"); // Explicitly set SQL Server column type for Price.
                                                  // (18 total digits, 2 after the decimal point)

            modelBuilder.Entity<Payment>()
                .Property(p => p.Amount)
                .HasColumnType("decimal(18, 2)"); // Explicitly set SQL Server column type for Amount.

            // --- Configure Enum to String Conversion (Optional but recommended for readability in DB) ---
            modelBuilder.Entity<Reservation>()
                .Property(r => r.reservationStatus)
                .HasConversion<string>(); // Stores the enum as its string name (e.g., "Confirmed") in the database.
                                          // By default, it would store the integer value.
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();
        }
    }



    // Optional: define a test model if needed
    public class User
    {
        public int Id { get; set; } // This becomes the primary key (auto-increment)
        public string Email { get; set; }
        public string Name { get; set; }
        public string Password { get; set; }
        //public ICollection<Reservation> Reservations { get; set; } // Navigation property to Reservation
        public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }

    public class Hotel
    {
        public int Id { get; set; } // This becomes the primary key (auto-increment)
        public string Name { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string State { get; set; }

        //list of rooms
        public ICollection<Room> Rooms { get; set; } = new List<Room>(); // Initialize the collection
    }

    public class Room
    {
        public int Id { get; set; }
        
        [Required]
        public int HotelId { get; set; }
        
        [Required]
        [StringLength(50)]
        public string RoomType { get; set; }
        
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than 0")]
        public decimal Price { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        // Make Hotel navigation property optional during creation
        public Hotel? Hotel { get; set; }
        public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    }

    public class Reservation
    {
        public int Id { get; set; }
        public int UserId { get; set; } // Foreign key to User
        public int RoomId { get; set; } // Foreign key to Room
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public ReservationStatus reservationStatus { get; set; } // Enum for reservation status
        public User? User { get; set; } // Navigation property to User, made nullable
        public Room? Room { get; set; } // Navigation property to Room, made nullable
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }

    public class Payment
    {
        public int Id { get; set; }
        public int ReservationId { get; set; } // Foreign key to Reservation
        public int UserId { get; set; } // Foreign key to User
        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; }
        public string PaymentMethod { get; set; } // e.g., Credit Card, PayPal, etc.
        public Reservation Reservation { get; set; } // Navigation property to Reservation
        public User User { get; set; } // Navigation property to User
    }

    public enum ReservationStatus
    {
        Pending,
        Confirmed,
        Cancelled,
        CheckedIn,
        CheckedOut
    }
}