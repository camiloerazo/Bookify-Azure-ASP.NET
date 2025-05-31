using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using Microsoft.AspNetCore.Http;
using Bookify.Server.Data;

namespace Bookify.Server.Controllers
{
    [Route("/hotels")]
    [ApiController]
    public class HotelsController : ControllerBase
    {
        private readonly BookifyDbContext _context;

        public HotelsController(BookifyDbContext context)
        {
            _context = context;
        }

        // GET: /hotels
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<Hotel>>> GetHotels()
        {
            try
            {
                var hotels = await _context.Hotels.ToListAsync();
                return Ok(hotels);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error occurred.");
            }
        }

        // GET: /hotels/{id}
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<Hotel>> GetHotel(int id)
        {
            try
            {
                var hotel = await _context.Hotels.FindAsync(id);

                if (hotel == null)
                {
                    return NotFound();
                }

                return Ok(hotel);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error occurred.");
            }
        }

        // POST: /hotels
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<Hotel>> CreateHotel([FromBody] Hotel hotel)
        {
            if (hotel == null)
            {
                return BadRequest("Hotel object is null.");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                _context.Hotels.Add(hotel);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetHotel), new { id = hotel.Id }, hotel);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error occurred.");
            }
        }

        // PUT: /hotels/{id}
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UpdateHotel(int id, [FromBody] Hotel hotel)
        {
            if (id != hotel.Id)
            {
                return BadRequest("Invalid ID.");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                if (!await _context.Hotels.AnyAsync(e => e.Id == id))
                {
                    return NotFound();
                }

                _context.Entry(hotel).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.Hotels.AnyAsync(e => e.Id == id))
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

        // DELETE: /hotels/{id}
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteHotel(int id)
        {
            try
            {
                var hotel = await _context.Hotels.FindAsync(id);
                if (hotel == null)
                {
                    return NotFound();
                }

                _context.Hotels.Remove(hotel);
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