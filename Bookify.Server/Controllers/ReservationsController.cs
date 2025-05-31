using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using Microsoft.AspNetCore.Http;
using Bookify.Server.Data;

namespace Bookify.Server.Controllers
{
    [Route("/reservations")]
    [ApiController]
    public class ReservationsController : ControllerBase
    {
        private readonly BookifyDbContext _context;

        public ReservationsController(BookifyDbContext context)
        {
            _context = context;
        }

        // GET: /reservations
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<Reservation>>> GetReservations()
        {
            try
            {
                var reservations = await _context.Reservations
                    .Include(r => r.User)
                    .Include(r => r.Room)
                        .ThenInclude(room => room.Hotel)
                    .ToListAsync();
                return Ok(reservations);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error occurred.");
            }
        }

        // GET: /reservations/{id}
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<Reservation>> GetReservation(int id)
        {
            try
            {
                var reservation = await _context.Reservations
                    .Include(r => r.User)
                    .Include(r => r.Room)
                        .ThenInclude(room => room.Hotel)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (reservation == null)
                {
                    return NotFound();
                }

                return Ok(reservation);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error occurred.");
            }
        }

        // POST: /reservations
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<Reservation>> CreateReservation([FromBody] Reservation reservation)
        {
            if (reservation == null)
            {
                return BadRequest("Reservation object is null.");
            }

            try
            {
                // Validate required fields
                if (reservation.UserId <= 0)
                    return BadRequest("Valid UserId is required");
                if (reservation.RoomId <= 0)
                    return BadRequest("Valid RoomId is required");
                if (reservation.CheckInDate == default)
                    return BadRequest("Check-in date is required");
                if (reservation.CheckOutDate == default)
                    return BadRequest("Check-out date is required");
                if (reservation.CheckInDate >= reservation.CheckOutDate)
                    return BadRequest("Check-in date must be before check-out date");
                if (reservation.CheckInDate < DateTime.Today)
                    return BadRequest("Check-in date cannot be in the past");

                // Verify that the user exists
                var user = await _context.Users.FindAsync(reservation.UserId);
                if (user == null)
                {
                    return NotFound($"User with ID {reservation.UserId} not found");
                }

                // Verify that the room exists
                var room = await _context.Rooms.FindAsync(reservation.RoomId);
                if (room == null)
                {
                    return NotFound($"Room with ID {reservation.RoomId} not found");
                }

                // Check if the room is available for the selected dates
                var conflictingReservation = await _context.Reservations
                    .Where(r => r.RoomId == reservation.RoomId &&
                               r.reservationStatus != ReservationStatus.Cancelled &&
                               ((r.CheckInDate <= reservation.CheckInDate && r.CheckOutDate > reservation.CheckInDate) ||
                                (r.CheckInDate < reservation.CheckOutDate && r.CheckOutDate >= reservation.CheckOutDate) ||
                                (r.CheckInDate >= reservation.CheckInDate && r.CheckOutDate <= reservation.CheckOutDate)))
                    .FirstOrDefaultAsync();

                if (conflictingReservation != null)
                {
                    return BadRequest("Room is not available for the selected dates");
                }

                // Set the initial status to Pending
                reservation.reservationStatus = ReservationStatus.Pending;

                _context.Reservations.Add(reservation);
                await _context.SaveChangesAsync();

                // Include related data in the response
                var createdReservation = await _context.Reservations
                    .Include(r => r.User)
                    .Include(r => r.Room)
                        .ThenInclude(room => room.Hotel)
                    .FirstOrDefaultAsync(r => r.Id == reservation.Id);

                return CreatedAtAction(nameof(GetReservation), new { id = reservation.Id }, createdReservation);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred while creating the reservation.");
            }
        }

        // PUT: /reservations/{id}/status
        [HttpPut("{id}/status")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UpdateReservationStatus(int id, [FromBody] ReservationStatus newStatus)
        {
            try
            {
                var reservation = await _context.Reservations.FindAsync(id);
                if (reservation == null)
                {
                    return NotFound();
                }

                reservation.reservationStatus = newStatus;
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