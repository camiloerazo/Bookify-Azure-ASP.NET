using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using Microsoft.AspNetCore.Http;
using Bookify.Server.Data;
using System.Linq;

namespace Bookify.Server.Controllers
{
    [Route("/rooms")]
    [ApiController]
    public class RoomsController : ControllerBase
    {
        private readonly BookifyDbContext _context;

        public RoomsController(BookifyDbContext context)
        {
            _context = context;
        }

        // GET: /rooms
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<Room>>> GetRooms()
        {
            try
            {
                Console.WriteLine("=== GetRooms Request Started ===");
                
                // Check database connection
                try
                {
                    var connectionString = _context.Database.GetConnectionString();
                    Console.WriteLine($"Database connection string (first part): {connectionString?.Split(';').FirstOrDefault()}");
                    
                    if (!await _context.Database.CanConnectAsync())
                    {
                        var error = "Cannot connect to the database. Please check:";
                        error += "\n1. Is SQL Server running?";
                        error += "\n2. Is the connection string correct?";
                        error += "\n3. Have migrations been applied?";
                        Console.WriteLine(error);
                        return StatusCode(StatusCodes.Status500InternalServerError, error);
                    }
                    Console.WriteLine("Database connection successful");
                }
                catch (Exception dbEx)
                {
                    Console.WriteLine($"Database connection error: {dbEx.Message}");
                    if (dbEx.InnerException != null)
                    {
                        Console.WriteLine($"Inner exception: {dbEx.InnerException.Message}");
                    }
                    return StatusCode(StatusCodes.Status500InternalServerError, 
                        $"Database connection error: {dbEx.Message}");
                }

                // Try to get the rooms
                try
                {
                    Console.WriteLine("Attempting to fetch rooms from database...");
                    var rooms = await _context.Rooms
                        .Include(r => r.Hotel)
                        .ToListAsync();

                    Console.WriteLine($"Successfully fetched {rooms.Count} rooms");
                    return Ok(rooms);
                }
                catch (Exception queryEx)
                {
                    Console.WriteLine($"Error executing query: {queryEx.Message}");
                    if (queryEx.InnerException != null)
                    {
                        Console.WriteLine($"Inner exception: {queryEx.InnerException.Message}");
                        if (queryEx.InnerException.InnerException != null)
                        {
                            Console.WriteLine($"Inner inner exception: {queryEx.InnerException.InnerException.Message}");
                        }
                    }
                    return StatusCode(StatusCodes.Status500InternalServerError, 
                        $"Error fetching rooms: {queryEx.Message}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"=== Unexpected error in GetRooms ===");
                Console.WriteLine($"Error message: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                    if (ex.InnerException.InnerException != null)
                    {
                        Console.WriteLine($"Inner inner exception: {ex.InnerException.InnerException.Message}");
                    }
                }
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                Console.WriteLine("=================================");
                
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    $"An unexpected error occurred: {ex.Message}");
            }
        }

        // GET: /rooms/{id}
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<Room>> GetRoom(int id)
        {
            try
            {
                var room = await _context.Rooms
                    .Include(r => r.Hotel)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (room == null)
                {
                    return NotFound();
                }

                return Ok(room);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error occurred.");
            }
        }

        // GET: /rooms/hotel/{hotelId}
        [HttpGet("hotel/{hotelId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<Room>>> GetRoomsByHotel(int hotelId)
        {
            try
            {
                var hotel = await _context.Hotels.FindAsync(hotelId);
                if (hotel == null)
                {
                    return NotFound("Hotel not found");
                }

                var rooms = await _context.Rooms
                    .Include(r => r.Hotel)
                    .Where(r => r.HotelId == hotelId)
                    .ToListAsync();

                return Ok(rooms);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error occurred.");
            }
        }

        // POST: /rooms
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<Room>> CreateRoom([FromBody] Room room)
        {
            if (room == null)
            {
                return BadRequest("Room object is null.");
            }

            try
            {
                // Log the incoming room data
                Console.WriteLine($"Creating room with data: HotelId={room.HotelId}, Name={room.Name}, Price={room.Price}, RoomType={room.RoomType}");

                // Verify that the hotel exists
                var hotel = await _context.Hotels.FindAsync(room.HotelId);
                if (hotel == null)
                {
                    return NotFound($"Hotel with ID {room.HotelId} not found");
                }

                // Validate required fields
                if (string.IsNullOrWhiteSpace(room.Name))
                    return BadRequest("Room name is required");
                if (string.IsNullOrWhiteSpace(room.RoomType))
                    return BadRequest("Room type is required");
                if (room.Price <= 0)
                    return BadRequest("Price must be greater than 0");

                // Create a new room without the navigation property
                var newRoom = new Room
                {
                    HotelId = room.HotelId,
                    RoomType = room.RoomType,
                    Price = room.Price,
                    Name = room.Name
                };

                _context.Rooms.Add(newRoom);
                
                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateException dbEx)
                {
                    // Log the database error
                    Console.WriteLine($"Database error: {dbEx.Message}");
                    if (dbEx.InnerException != null)
                    {
                        Console.WriteLine($"Inner exception: {dbEx.InnerException.Message}");
                    }
                    return StatusCode(StatusCodes.Status500InternalServerError, 
                        "Database error occurred while creating the room. Please check the server logs.");
                }

                // Include hotel information in the response
                var createdRoom = await _context.Rooms
                    .Include(r => r.Hotel)
                    .FirstOrDefaultAsync(r => r.Id == newRoom.Id);

                if (createdRoom == null)
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, 
                        "Room was created but could not be retrieved. Please check the server logs.");
                }

                return CreatedAtAction(nameof(GetRoom), new { id = newRoom.Id }, createdRoom);
            }
            catch (Exception ex)
            {
                // Log the full exception
                Console.WriteLine($"Error creating room: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    "An unexpected error occurred while creating the room. Please check the server logs.");
            }
        }

        // PUT: /rooms/{id}
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UpdateRoom(int id, [FromBody] Room room)
        {
            if (id != room.Id)
            {
                return BadRequest("Invalid ID.");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Verify that the room exists
                var existingRoom = await _context.Rooms.FindAsync(id);
                if (existingRoom == null)
                {
                    return NotFound("Room not found");
                }

                // Verify that the hotel exists if it's being changed
                if (existingRoom.HotelId != room.HotelId)
                {
                    var hotel = await _context.Hotels.FindAsync(room.HotelId);
                    if (hotel == null)
                    {
                        return NotFound("Hotel not found");
                    }
                }

                _context.Entry(room).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.Rooms.AnyAsync(e => e.Id == id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error occurred.");
            }
        }

        // DELETE: /rooms/{id}
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteRoom(int id)
        {
            try
            {
                var room = await _context.Rooms.FindAsync(id);
                if (room == null)
                {
                    return NotFound();
                }

                // Check if the room has any reservations
                var hasReservations = await _context.Reservations
                    .AnyAsync(r => r.RoomId == id);

                if (hasReservations)
                {
                    return BadRequest("Cannot delete room with existing reservations.");
                }

                _context.Rooms.Remove(room);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error occurred.");
            }
        }
    }
} 