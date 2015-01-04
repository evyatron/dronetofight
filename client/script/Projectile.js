var Projectile = (function(INHERITS_FROM) {
  function Projectile(options) {
    options.type = window.SPRITE_TYPES.PROJECTILE;
    options.isCentered = true;
    !options.id && (options.id = 'projectile_' + Date.now());
    !options.width && (options.width = 2);
    !options.height && (options.height = 2);
    
    INHERITS_FROM && INHERITS_FROM.call(this, options);
    
    this.teamId = options.teamId;
  }
  
  if (INHERITS_FROM) {
    Projectile.prototype = Object.create(INHERITS_FROM.prototype);
    Projectile.prototype.constructor = Projectile;
  }
  
  
  // Locally check for hits as well
  // The server will tell the client when the remove the projectile,
  // But in case there's lag - we don't want the projectile to go through
  // Whatever it's hitting
  Projectile.prototype.hits = function hits(bounds) {
    var x = this.position.x,
        y = this.position.y,
        position = bounds.position? bounds.position : bounds,
        doesHit = x > position.x && x < position.x + bounds.width &&
                  y > position.y && y < position.y + bounds.height;

    if (doesHit) {
      this.destroy();
    }
    
    return doesHit;
  };

  return Projectile;
}(window.Sprite));