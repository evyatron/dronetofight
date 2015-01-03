var Projectile = (function(INHERITS_FROM) {
  function Projectile(options) {
    options.type = window.SPRITE_TYPES.PROJECTILE;
    !options.id && (options.id = 'projectile_' + Date.now());
    !options.width && (options.width = 2);
    !options.height && (options.height = 2);
    
    INHERITS_FROM && INHERITS_FROM.call(this, options);
  }
  
  if (INHERITS_FROM) {
    Projectile.prototype = Object.create(INHERITS_FROM.prototype);
    Projectile.prototype.constructor = Projectile;
  }

  return Projectile;
}(window.Sprite));