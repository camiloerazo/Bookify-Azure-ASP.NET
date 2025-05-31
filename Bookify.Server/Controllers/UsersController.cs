using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System;
using Microsoft.AspNetCore.Http;

// Add this using statement for your data context
// and make sure you have the correct namespace for your models.
using Bookify.Server.Data; // Replace YourNamespace with your actual namespace
//using YourNamespace.Models; // Replace YourNamespace with your actual namespace

namespace Bookify.Server.Controllers
{
    [Route("/users")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly BookifyDbContext _context;

        public UsersController(BookifyDbContext context)
        {
            _context = context;
        }

        // 1. GET /api/users
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            Console.Write("im on get function");
            try
            {
                var users = await _context.Users.ToListAsync();
                return Ok(users);
            }
            catch (Exception ex)
            {
                // Log the error!
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error occurred.");
            }
        }

        // 2.1 GET 
        [HttpGet("consult/{email}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<User>> GetUserByEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return BadRequest("Email is required.");
            }

            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

                if (user == null)
                {
                    return NotFound();
                }

                return Ok(user);
            }
            catch (Exception ex)
            {
                // Log the error!
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error occurred.");
            }
        }
        
        // 2. GET /api/users/{id}
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            if (id <= 0)
            {
                return BadRequest("Invalid ID.");
            }
            try
            {
                var user = await _context.Users
                    .Include(u => u.Reservations)
                        .ThenInclude(r => r.Room)
                            .ThenInclude(room => room.Hotel)
                    .Include(u => u.Payments)
                    .FirstOrDefaultAsync(u => u.Id == id);

                if (user == null)
                {
                    return NotFound();
                }

                return Ok(user);
            }
            catch (Exception ex)
            {
                // Log the error!
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error occurred.");
            }
        }
        
        // 3. POST /api/users
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<User>> CreateUser([FromBody] User user)
        {
            Console.Write("post called");
            if (user == null)
            {
                return BadRequest("User object is null.");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // 201 Created, returning the new object and the URI to get it
                return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
            }
            catch (DbUpdateException ex)
            {
                // Handle specific database exceptions (e.g., unique constraint violation)
                return BadRequest("Error creating user.  Possible data issue.");
            }
            catch (Exception ex)
            {
                // Log the error!
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error occurred.");
            }
        }



        // 4. PUT /api/users/{id}
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] User user)
        {
            if (id <= 0 || id != user.Id)
            {
                return BadRequest("Invalid ID.");
            }

            if (user == null)
            {
                return BadRequest("User object is null.");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                if (!await _context.Users.AnyAsync(e => e.Id == id))
                {
                    return NotFound();
                }

                _context.Entry(user).State = EntityState.Modified; //Update
                await _context.SaveChangesAsync();

                return NoContent(); // 204 No Content
            }
            catch (DbUpdateConcurrencyException ex)
            {
                // Handle concurrency issues (someone else updated the data)
                return Conflict("The user has been modified by another user. Please try again.");
            }
            catch (Exception ex)
            {
                // Log the error!
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error occurred.");
            }
        }

        // 5. DELETE /api/users/{id}
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteUser(int id)
        {
            if (id <= 0)
            {
                return BadRequest("Invalid ID.");
            }

            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null)
                {
                    return NotFound();
                }

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                return NoContent(); // 204 No Content
            }
            catch (Exception ex)
            {
                // Log the error!
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error occurred.");
            }
        }
    }
}

